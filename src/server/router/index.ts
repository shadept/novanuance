// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";

import { employeeRouter } from "./employee";
import { vacationRouter } from "./vacation";
import { holidayRouter } from "./holiday";
import { receiptRouter } from "./receipt";
import { inventoryRouter } from "./inventory";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("employee.", employeeRouter)
  .merge("holiday.", holidayRouter)
  .merge("inventory.", inventoryRouter)
  .merge("receipt.", receiptRouter)
  .merge("vacation.", vacationRouter);
;

// export type definition of API
export type AppRouter = typeof appRouter;
