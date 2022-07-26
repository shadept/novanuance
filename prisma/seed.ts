import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient()

async function seed() {
    const employees: Prisma.EmployeeCreateInput[] = [
        {
            name: "Casa",
            title: "owner",
            baseSalary: 0.0,
            commissionPercent: 0.0,
            thresholdForCommission: 0.0,
            taxRate: 0.23,
        },
        {
            name: "Carla",
            title: "hairdresser",
            baseSalary: 627.45,
            commissionPercent: 0.15,
            thresholdForCommission: 1410.0,
            taxRate: 0.23,
        },
        {
            name: "Cristina",
            title: "hairdresser",
            baseSalary: 0,
            commissionPercent: 0.4,
            thresholdForCommission: 0.0,
            taxRate: 0.23 * 0.5,
        },
        {
            name: "Pedro",
            title: "barber",
            baseSalary: 0.0,
            commissionPercent: 0.65,
            thresholdForCommission: 0.0,
            taxRate: 0.0,
        },
        {
            name: "Isabel",
            title: "manicurist",
            baseSalary: 627.45,
            commissionPercent: 0.8,
            thresholdForCommission: 0.0,
            taxRate: 0.23,
        },
        {
            name: "Sara",
            title: "beautician",
            baseSalary: 627.45,
            commissionPercent: 0.8,
            thresholdForCommission: 0.0,
            taxRate: 0.23,
        }
    ]

    for (const employee of employees) {
        await prisma.employee.create({ data: employee })
    }
}

seed()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
