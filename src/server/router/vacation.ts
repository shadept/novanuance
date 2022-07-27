import { createRouter } from "./context";
import { z } from "zod";

export const vacationRouter = createRouter()
    .query("byMonth", {
        input: z.object({
            year: z.number(),
            month: z.number(),
            employeeId: z.string().nullish(),
        }),
        async resolve({ ctx, input }) {
            const vacations = await ctx.prisma.vacation.findMany({
                where: {
                    employeeId: input.employeeId || undefined,
                    date: {
                        gte: new Date(input.year, input.month - 1, 1),
                        lt: new Date(input.year, input.month, 1),
                    },
                },
                include: {
                    employee: {
                        select: {
                            terminationDate: true
                        }
                    }
                }
            });
            return vacations
                .filter(v => v.employee.terminationDate === null || v.employee.terminationDate > v.date)
                .map(({ employee, ...v }) => v);
        },
    })
    .mutation("update", {
        input: z.object({
            id: z.string().nullish(),
            employeeId: z.string(),
            date: z.date(),
        }),
        async resolve({ ctx, input }) {
            return await ctx.prisma.vacation.upsert({
                where: {
                    id: input.id || "",
                },
                create: {
                    employeeId: input.employeeId,
                    date: input.date,
                },
                update: {
                    employeeId: input.employeeId,
                    date: input.date,
                },
            });
        }
    })
    .mutation("delete", {
        input: z.object({
            id: z.string(),
        }),
        async resolve({ ctx, input }) {
            return await ctx.prisma.vacation.delete({
                where: {
                    id: input.id,
                },
            });
        }
    })
    ;
