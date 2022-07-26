import { createRouter } from "./context";
import { z } from "zod";
import { Employee } from "@prisma/client";

const toDto = (e: Employee) => ({
    id: e.id,
    name: e.name,
    title: e.title,
    baseSalary: e.baseSalary.toNumber(),
    commissionPercent: e.commissionPercent.toNumber(),
    thresholdForCommission: e.thresholdForCommission.toNumber(),
    taxRate: e.taxRate.toNumber(),
    hireDate: e.hireDate,
    terminationDate: e.terminationDate,
})

export const employeeRouter = createRouter()
    .query("byMonth", {
        input: z.object({
            year: z.number(),
            month: z.number(),
            excludeOwner: z.boolean().default(false),
        }),
        async resolve({ ctx, input }) {
            const date = new Date(input.year, input.month - 1, 1);
            const employees = await ctx.prisma.employee.findMany({
                where: {
                    title: input.excludeOwner ? { not: "owner" } : undefined,
                    hireDate: { lte: date },
                    OR: [
                        { terminationDate: { gte: date } },
                        { terminationDate: null }
                    ]
                },
                orderBy: {
                    id: "asc"
                }
            });

            return employees.map(toDto)
        },
    });
