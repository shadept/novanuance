import { PrismaClient, Prisma } from "@prisma/client";
import { addDays, startOfDay, subDays } from "date-fns"

const prisma = new PrismaClient()

async function seedEmployeeManagement() {
    if (await prisma.employee.count() !== 0) return
    const employees = await prisma.employee.createMany({
        data: [
            {
                name: "Casa",
                title: "owner",
                baseSalary: 0.0,
                commissionPercent: 0.0,
                thresholdForCommission: 0.0,
                taxRate: 0.23,
                hireDate: new Date("1970-01-01"),
            },
            {
                name: "Carla",
                title: "hairdresser",
                baseSalary: 627.45,
                commissionPercent: 0.15,
                thresholdForCommission: 1410.0,
                taxRate: 0.23,
                hireDate: new Date("1970-01-01"),
            },
            {
                name: "Cristina",
                title: "hairdresser",
                baseSalary: 0,
                commissionPercent: 0.4,
                thresholdForCommission: 0.0,
                taxRate: 0.23 * 0.5,
                hireDate: new Date("1970-01-01"),
            },
            {
                name: "Pedro",
                title: "barber",
                baseSalary: 0.0,
                commissionPercent: 0.65,
                thresholdForCommission: 0.0,
                taxRate: 0.0,
                hireDate: new Date("1970-01-01"),
            },
            {
                name: "Isabel",
                title: "manicurist",
                baseSalary: 627.45,
                commissionPercent: 0.8,
                thresholdForCommission: 0.0,
                taxRate: 0.23,
                hireDate: new Date("1970-01-01"),
            },
            {
                name: "Sara",
                title: "beautician",
                baseSalary: 627.45,
                commissionPercent: 0.8,
                thresholdForCommission: 0.0,
                taxRate: 0.23,
                hireDate: new Date("1970-01-01"),
            }
        ]
    })
}

async function seedInventoryManagement() {
    if (await prisma.inventoryItem.count() !== 0) return
    await prisma.inventoryItem.createMany({
        data: [
            {
                brand: "Cien",
                name: "Champô Anticaspa",
                price: 1.32,
                imageUrl: "https://i.ebayimg.com/images/g/Mk0AAOSwPrdhdZEK/s-l1600.jpg",
                barcode: "4056489424185",
                description: "O champô anticaspa Cien com aroma de limão foi concebido para couros cabelucos secons, com comichão e com tendência para a caspa."
            },
            {
                brand: "Axe",
                name: "Wild Mojito & Cedarwood",
                price: 1.32,
                imageUrl: "https://i.ebayimg.com/images/g/QVYAAOSwGrFhCMOq/s-l1600.jpg",
                barcode: "8717163947739",
                description: "Bodywash"
            },
            {
                brand: "Trident",
                name: "Peppermint",
                price: 5.2,
                barcode: "7622210642707"
            },
            {
                brand: "La Cestera",
                name: "Biscoitos de Amêndoa",
                price: 0,
                barcode: "4056489575375"
            },
            {
                brand: "Expresso",
                name: "Jornal",
                price: 0,
                barcode: "5602841001021"
            },
            {
                brand: "Apple",
                name: "MagSafe Charger",
                price: 0,
                barcode: "194252192467"
            },
            {
                brand: "d.rect",
                name: "Compressed Gas",
                price: 0,
                barcode: "5902308721425"
            },
            {
                brand: "Cosequin",
                name: "Advance",
                price: 0,
                barcode: "5391533250655"
            },
            {
                brand: "Cuétera",
                name: "Choco Flakes",
                price: 0,
                barcode: "8434165582170"
            }]
    })
    const inventory = await prisma.inventoryItem.findMany()
    const warehouse = await prisma.warehouse.create({
        data: {
            name: "Nova Nuance",
            address: "Largo da Graça 48, 1170-165 Lisboa",
        }
    })
    await prisma.inventoryStock.createMany({
        data: inventory.map(i => ({
            warehouseId: warehouse.id,
            itemId: i.id,
            quantity: 5
        }))
    })

    const start = startOfDay(subDays(new Date(), 30))
    await prisma.inventoryStockHistory.createMany({
        data: inventory.flatMap(item => {
            const history = [...Array(29)].map((_, i) => ({
                warehouseId: warehouse.id,
                itemId: item.id,
                date: addDays(start, i),
                quantity: Math.max(5 + Math.trunc(Math.random() * 5 - 2.5), 0)
            }))
            history.push({
                warehouseId: warehouse.id,
                itemId: item.id,
                date: addDays(start, 29),
                quantity: 5
            })
            return history
        })
    })
}

async function seed() {
    await seedEmployeeManagement()
    await seedInventoryManagement()
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
