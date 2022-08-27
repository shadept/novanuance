import { InventoryItem, Prisma } from "@prisma/client";
import { z } from "zod";
import { createRouter } from "./context";

type Inventory = InventoryItem

const toDto = (item: InventoryItem & { stock: { quantity: number; }[] }) => ({
    id: item.id,
    brand: item.brand,
    name: item.name,
    price: item.price.toNumber(),
    quantity: item.stock.reduce((q, s) => q + s.quantity, 0),
    imageUrl: item.imageUrl ?? undefined,
    barcode: item.barcode,
    description: item.description ?? undefined,
})


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
            name: z.string(),
            price: z.number(),
            quantity: z.number(),
            imageUrl: z.string().nullish(),
            description: z.string().nullish(),
        }),
        async resolve({ ctx, input }) {
            const warehouse = await ctx.prisma.warehouse.findFirst()
            if (warehouse === null) {
                console.error("Missing warehouse")
                return ctx.res.status(404)
            }

            console.log("upserting", input)
            const obj = {
                brand: input.brand,
                name: input.name,
                price: input.price,
                imageUrl: input.imageUrl,
                barcode: input.barcode,
                description: input.description,
            }
            return await ctx.prisma.inventoryItem.upsert({
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
            });
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

            await ctx.prisma.inventoryStock.update({
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

            await ctx.prisma.inventoryStock.update({
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
        }
    })
    // .mutation("delete", {
    //     input: z.object({
    //         id: z.string(),
    //     }),
    //     async resolve({ ctx, input }) {
    //         return await ctx.prisma.vacation.delete({
    //             where: {
    //                 id: input.id,
    //             },
    //         });
    //     }
    // })
    ;
