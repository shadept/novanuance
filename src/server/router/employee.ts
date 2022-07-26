import { createRouter } from "./context";
import { z } from "zod";

export const employeeRouter = createRouter()
    .query("getAll", {
        input: z.object({
            excludeOwner: z.boolean().default(false),
        }).default({}),
        async resolve({ ctx, input }) {
            const employees = await ctx.prisma.employee.findMany({
                where: {
                    title: input.excludeOwner ? { not: "owner" } : undefined,
                }
            });

            return employees.map(e => ({
                id: e.id,
                name: e.name,
                title: e.title,
                baseSalary: e.baseSalary.toNumber(),
                commissionPercent: e.commissionPercent.toNumber(),
                thresholdForCommission: e.thresholdForCommission.toNumber(),
                taxRate: e.taxRate.toNumber()
            }))
        },
    });
