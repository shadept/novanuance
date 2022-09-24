import os
from datetime import datetime

from cuid import cuid
import polars as pl
import psycopg
from psycopg import sql


DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL is None:
    raise ValueError("DATABASE_URL cannot be None")

ITEMS_LOCATION = "scripts/20220922stock.csv"
STOCK_LOCATION = "scripts/20220922prices.csv"

conn = psycopg.connect(DATABASE_URL)

items = pl.read_csv(ITEMS_LOCATION, has_header=True, dtypes={"codigobarras": pl.Utf8}, sep=";", null_values=["...", "null"])
stock = pl.read_csv(STOCK_LOCATION, has_header=True, sep=";", null_values=["...", "null"])

items = items.select([
    pl.col("idproduto"),
    pl.col("codigobarras").alias("barcode"),
    pl.col("referencia").alias("reference"),
    pl.col("descritivo").alias("name"),
    pl.col("classe").fill_null("").alias("brand"),
    pl.col("classes").fill_null("").alias("subBrand"),
    ("{" + pl.col("classet").str.to_lowercase() + "}").fill_null("{}").alias("tags"),
]).filter(pl.col("barcode").is_not_null())

stock = stock.select([
    pl.col("idproduto"),
    pl.col("qtd").alias("quantity"),
    pl.col("custo").str.replace(",", ".").cast(pl.Float32).alias("price"),
]).with_column(pl.when(pl.col("idproduto") == 238).then(6).otherwise(pl.col("quantity")).alias("quantity"))

warehouse = conn.execute("SELECT id FROM public.\"Warehouse\"").fetchone()
if warehouse is None:
    raise Exception("No warehouse in DB")

warehouseId = warehouse[0]

result = items.join(stock, on="idproduto").drop("idproduto")
result.insert_at_idx(0, pl.Series("id", [cuid() for _ in range(len(result))]))
result.insert_at_idx(0, pl.Series("warehouseId", [warehouseId for _ in range(len(result))]))

inventoryItems = result.drop(["warehouseId", "quantity", "reference"])
inventoryStock = result.select([
    pl.col("warehouseId"),
    pl.col("id").alias("itemId"),
    pl.col("quantity"),
])
inventoryStockHistory = inventoryStock.with_column(pl.Series("date", [datetime(2022, 9, 22, 10, 0, 0) for _ in range(len(inventoryStock))]))


def polars_to_sql(df: pl.DataFrame, tableName: str, conn: psycopg.Connection):
    columns = sql.SQL(",").join(sql.Identifier(name) for name in df.columns)
    values = sql.SQL(",").join(sql.Placeholder() for _ in df.columns)
    insert_stmt = sql.SQL("INSERT INTO {} ({}) VALUES({});").format(sql.Identifier(tableName), columns, values)

    cur = conn.cursor()
    try:
        print(insert_stmt.as_string(cur))
        cur.executemany(insert_stmt, df.rows())
        conn.commit()
    except Exception as e:
        print(e)
        cur.close()
        conn.rollback()




polars_to_sql(inventoryItems, "InventoryItem", conn)
polars_to_sql(inventoryStock, "InventoryStock", conn)
polars_to_sql(inventoryStockHistory, "InventoryStockHistory", conn)
