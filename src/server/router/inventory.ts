import { InventoryItem, InventoryStockHistory, Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createRouter } from "./context";


const toDto = (item: InventoryItem & { stock: { quantity: number; }[] }) => ({
    id: item.id,
    brand: item.brand,
    subBrand: item.subBrand ?? undefined,
    name: item.name,
    price: item.price.toNumber(),
    quantity: item.stock.reduce((q, s) => q + s.quantity, 0),
    imageUrl: item.imageUrl ?? undefined,
    barcode: item.barcode,
    tags: item.tags,
    description: item.description ?? undefined,
})

const updateStockHistory = async (prisma: PrismaClient, warehouseId: string, itemId: string, quantity: number, date?: Date): Promise<InventoryStockHistory> => {
    const today = (date ?? new Date())
    today.setUTCHours(0, 0, 0, 0)
    return await prisma.inventoryStockHistory.upsert({
        where: {
            warehouseId_itemId_date: {
                warehouseId: warehouseId,
                itemId: itemId,
                date: today
            }
        },
        create: {
            warehouseId: warehouseId,
            itemId: itemId,
            date: today,
            quantity: quantity
        },
        update: {
            quantity: quantity
        }
    })
}

export const inventoryRouter = createRouter()
    .query("getAll", {
        input: z.object({
            filter: z.string().nullish(),
            limit: z.number().min(1).max(25).nullish(),
            cursor: z.string().nullish(),
        }),
        async resolve({ ctx, input }) {
            const limit = input.limit ?? 50;
            const { cursor } = input
            const whereFilter: Prisma.InventoryItemWhereInput = {
                OR: input.filter ? [
                    { name: { contains: input.filter, mode: "insensitive" } },
                    { brand: { contains: input.filter, mode: "insensitive" } },
                    { subBrand: { contains: input.filter, mode: "insensitive" } },
                    { barcode: { startsWith: input.filter } },
                ] : undefined,
            }
            const itemCount = await ctx.prisma.inventoryItem.count({ where: whereFilter })
            const items = await ctx.prisma.inventoryItem.findMany({
                where: whereFilter,
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: {
                    id: "asc"
                },
                include: {
                    stock: {
                        select: { quantity: true }
                    }
                }
            })
            let nextCursor: typeof cursor | null = null;
            if (items.length > limit) {
                const nextItem = items.pop()!
                nextCursor = nextItem.id
            }

            return { items: items.map(toDto), nextCursor, pages: Math.ceil(itemCount / limit) }
        },
    })
    .query("getStockHistory", {
        input: z.object({
            itemId: z.string(),
            start: z.date()
        }),
        async resolve({ ctx, input }) {
            const warehouse = await ctx.prisma.warehouse.findFirst()
            if (warehouse === null) {
                console.error("Missing warehouse")
                return []
            }

            const history: InventoryStockHistory[] = await ctx.prisma.inventoryStockHistory.findMany({
                where: {
                    warehouseId: warehouse.id,
                    itemId: input.itemId,
                    date: { gte: input.start }
                }
            })

            const today = new Date()
            today.setUTCHours(0, 0, 0, 0)
            if (history.length > 0 && history[history.length - 1]!.date !== today) {
                history.push({
                    ...history[history.length - 1]!,
                    date: today
                })
            }

            return history
        }
    })
    .query("exportStocks", {
        async resolve({ ctx }) {
            const warehouse = await ctx.prisma.warehouse.findFirst()
            if (warehouse === null) {
                console.error("Missing warehouse")
                return []
            }

            const items: { id: string, name: string }[] = await ctx.prisma.inventoryItem.findMany({
                where: { warehouseId: warehouse.id },
                select: { id: true, name: true },
            })
            const currentStock: { itemId: string, quantity: number }[] = await ctx.prisma.inventoryStock.findMany({
                where: { warehouseId: warehouse.id },
                select: { itemdId: true, quantity: true },
            })
            const historicalStock: { itemId: string, quantity: number, date: Date }[] = await ctx.prisma.inventoryStockHistory.findMany({
                where: { warehouseId: warehouse.id },
                select: { itemId: true, quantity: true, date: true },
                orderBy: [{ date: "asc" }]
            })

            const today = new Date()
            today.setUTCHours(0, 0, 0, 0)

            const result = items.map(item => {
                return ({
                    itemId: item.id,
                    name: item.name,
                    stock: [
                        ...historicalStock.filter(s => s.itemId === item.id),
                        ...currentStock.filter(s => s.itemId === item.id).map(s => ({ ...s, date: today }))
                    ]
                })
            })
            return result
        }
    })
    .query("byBarcode", {
        input: z.string(),
        async resolve({ ctx, input }) {
            const item = await ctx.prisma.inventoryItem.findFirst({
                where: {
                    barcode: input
                },
                include: {
                    stock: {
                        select: { quantity: true }
                    }
                }
            })
            if (item === null) {
                return ctx.res.status(404)
            }
            return toDto(item)
        },
    })
    .mutation("update", {
        input: z.object({
            id: z.string().nullish(),
            barcode: z.string(),
            brand: z.string(),
            subBrand: z.string().nullish(),
            name: z.string(),
            price: z.number(),
            quantity: z.number(),
            imageUrl: z.string().nullish(),
            description: z.string().nullish(),
            tags: z.array(z.string()),
        }),
        async resolve({ ctx, input }) {
            const warehouse = await ctx.prisma.warehouse.findFirst()
            if (warehouse === null) {
                console.error("Missing warehouse")
                return ctx.res.status(404)
            }

            const obj = {
                brand: input.brand,
                subBrand: input.subBrand,
                name: input.name,
                price: input.price,
                imageUrl: input.imageUrl,
                barcode: input.barcode,
                description: input.description,
                tags: input.tags,
            }

            const oldStock = await ctx.prisma.inventoryStock.findUnique({
                where: {
                    warehouseId_itemId: {
                        warehouseId: warehouse.id,
                        itemId: input.id || "",
                    }
                }
            })

            const item = await ctx.prisma.inventoryItem.upsert({
                where: {
                    id: input.id || "",
                },
                create: {
                    ...obj,
                    stock: {
                        create: {
                            warehouseId: warehouse.id,
                            quantity: input.quantity,
                        }
                    }
                },
                update: {
                    ...obj,
                    stock: {
                        upsert: [{
                            where: {
                                warehouseId_itemId: {
                                    warehouseId: warehouse.id,
                                    itemId: input.id || "",
                                }
                            },
                            create: {
                                warehouseId: warehouse.id,
                                quantity: input.quantity
                            },
                            update: {
                                quantity: input.quantity
                            }
                        }]
                    }
                },
                include: {
                    stock: true
                }
            });

            if (oldStock?.quantity !== input.quantity) {
                updateStockHistory(ctx.prisma, warehouse.id, item.id, input.quantity)
            }

            return toDto(item)
        }
    })
    .mutation("increaseStock", {
        input: z.string(),
        async resolve({ ctx, input }) {
            const warehouse = await ctx.prisma.warehouse.findFirst()
            if (warehouse === null) {
                console.error("Missing warehouse")
                return ctx.res.status(404)
            }

            const item = await ctx.prisma.inventoryItem.findUnique({ where: { barcode: input } })
            if (item === null) {
                console.error("Missing item")
                return ctx.res.status(404)
            }

            const stock = await ctx.prisma.inventoryStock.update({
                where: {
                    warehouseId_itemId: {
                        warehouseId: warehouse.id,
                        itemId: item.id
                    }
                },
                data: {
                    quantity: { increment: 1 }
                }
            })

            updateStockHistory(ctx.prisma, warehouse.id, item.id, stock.quantity)
        }
    })
    .mutation("decreaseStock", {
        input: z.string(),
        async resolve({ ctx, input }) {
            const warehouse = await ctx.prisma.warehouse.findFirst()
            if (warehouse === null) {
                console.error("Missing warehouse")
                return ctx.res.status(404)
            }

            const item = await ctx.prisma.inventoryItem.findUnique({ where: { barcode: input } })
            if (item === null) {
                console.error("Missing item")
                return ctx.res.status(404)
            }

            const stock = await ctx.prisma.inventoryStock.update({
                where: {
                    warehouseId_itemId: {
                        warehouseId: warehouse.id,
                        itemId: item.id
                    }
                },
                data: {
                    quantity: { decrement: 1 }
                }
            })

            updateStockHistory(ctx.prisma, warehouse.id, item.id, stock.quantity)
        }
    })
    .mutation("delete", {
        input: z.object({
            id: z.string(),
        }),
        async resolve({ ctx, input }) {
            await ctx.prisma.$transaction([
                ctx.prisma.inventoryStockHistory.deleteMany({ where: { itemId: input.id } }),
                ctx.prisma.inventoryStock.deleteMany({ where: { itemId: input.id } }),
                ctx.prisma.inventoryItem.delete({ where: { id: input.id } }),
            ])
        }
    })
    ;
