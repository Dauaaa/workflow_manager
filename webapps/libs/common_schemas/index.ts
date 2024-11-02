import dayjs from "dayjs";
import Decimal from "decimal.js";
import { z } from "zod";

export const standardUndefined = <T>(x: T | undefined | null): T | undefined => x === undefined || x === null ? undefined : x;
export const DayjsSchema = z.coerce.string().transform(date => dayjs(date));
export const DayjsTimeSchemaRev = z.unknown().refine(date => dayjs.isDayjs(date)).transform(date => date.toISOString());
export const DayjsDateSchemaRev = z.unknown().refine(date => dayjs.isDayjs(date)).transform(date => date.format("YYYY-MM-DD"));
export const DecimalSchema = z.coerce.string().transform(value => new Decimal(value));
export const IntegerSchema = z.number().transform(BigInt);

export type Assert<X extends true> = X;
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;
export type Extends<X, Y> = X extends Y ? true : false;
