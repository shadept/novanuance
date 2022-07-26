import { createRouter } from "./context";
import { z } from "zod";

export const receiptRouter = createRouter()
    .query("byMonth", {
        input: z.object({
            year: z.number(),
            month: z.number(),
            employeeId: z.string().nullish(),
        }),
        async resolve({ ctx, input }) {
            const receipts = await ctx.prisma.receipt.findMany({
                where: {
                    employeeId: input.employeeId || undefined,
                    date: {
                        gte: new Date(input.year, input.month - 1, 1),
                        lt: new Date(input.year, input.month, 1),
                    }
                }
            });

            return receipts.map(r => ({
                employeeId: r.employeeId,
                date: r.date,
                amount: r.amount.toNumber()
            }))
        },
    })
    .mutation("update", {
        input: z.object({
            employeeId: z.string(),
            date: z.date(),
            amount: z.number(),
        }),
        async resolve({ ctx, input }) {
            return await ctx.prisma.receipt.upsert({
                where: {
                    employeeId_date: {
                        employeeId: input.employeeId,
                        date: input.date,
                    }
                },
                create: input,
                update: input,
            });
        }
    })
    ;
