import { createRouter } from "./context";
import { z } from "zod";

export const inventoryRouter = createRouter()
    .query("getAll", {
        input: z.object({
            limit: z.number().min(1).max(100).nullish(),
            cursor: z.string().nullish(),
        }),
        async resolve({ ctx, input }) {
            const limit = input.limit ?? 50;
            const { cursor } = input
            const items = await ctx.prisma.inventoryItem.findMany({
                take: limit + 1,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: {
                    id: "asc"
                },
            })
            let nextCursor: typeof cursor | null = null;
            if (items.length > limit) {
                const nextItem = items.pop()!
                nextCursor = nextItem.id
            }

            return { items: items.map(i => ({ ...i, price: i.price.toNumber() })), nextCursor }
        },
    })
    // .mutation("update", {
    //     input: z.object({
    //         id: z.string().nullish(),
    //         employeeId: z.string(),
    //         date: z.date(),
    //     }),
    //     async resolve({ ctx, input }) {
    //         return await ctx.prisma.vacation.upsert({
    //             where: {
    //                 id: input.id || "",
    //             },
    //             create: {
    //                 employeeId: input.employeeId,
    //                 date: input.date,
    //             },
    //             update: {
    //                 employeeId: input.employeeId,
    //                 date: input.date,
    //             },
    //         });
    //     }
    // })
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
