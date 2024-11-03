import dayjs, { Dayjs } from "dayjs";
import Decimal from "decimal.js";
import { z } from "zod";

// necessary because can't z.instanceof(Dayjs)
type DayjsRev = z.ZodEffects<z.ZodType<Dayjs, z.ZodTypeDef, Dayjs>, string, Dayjs>;

export const standardUndefined = <T>(x: T | undefined | null): T | undefined => x === undefined || x === null ? undefined : x;
export const DayjsSchema = z.coerce.string().transform(date => dayjs(date));
export const DayjsTimeSchemaRev = z.unknown().refine(date => dayjs.isDayjs(date)).transform(date => date.toISOString()) as unknown as DayjsRev;
export const DayjsDateSchemaRev = z.unknown().refine(date => dayjs.isDayjs(date)).transform(date => date.format("YYYY-MM-DD")) as unknown as DayjsRev;
export const DecimalSchema = z.coerce.string().transform(value => new Decimal(value));
export const DecimalSchemaRev = z.instanceof(Decimal).transform(d => d.toString());
export const IntegerSchema = z.coerce.string().transform(BigInt);
export const IntegerSchemaRev = z.bigint().transform(String);

export type Assert<X extends true> = X;
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;
export type Extends<X, Y> = X extends Y ? true : false;
