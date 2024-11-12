import dayjs, { Dayjs } from "dayjs";
import Decimal from "decimal.js";
import { z } from "zod";

// necessary because can't z.instanceof(Dayjs)
type DayjsRev = z.ZodEffects<z.ZodType<Dayjs, z.ZodTypeDef, Dayjs>, string, Dayjs>;

export const standardUndefined = <T>(x: T | undefined | null): T | undefined => x === undefined || x === null ? undefined : x;
export const DayjsTimeSchema = z.string().or(z.number()).transform(date => dayjs(date));
export const DayjsDateSchema = z.string().transform(date => dayjs(date.slice(0, 10)));
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
export type UnionToFnIntersection<T> = (
  T extends T ? (x: () => T) => void : never
) extends (x: infer R) => void
  ? R
  : never;
export type UnionToIntersection<U> = (U extends any ? (arg: U) => any : never) extends ((arg: infer I) => void) ? I : never

/**
 * Walk object using dot as delimiter
 *
 * @example 
 * ```
 * type Obj = { a: { b: number; x: 'a' }; c: string };
 
 * type A = TypeGet<Obj, 'a'>; // { a: { b: number; x: 'a' } }
 * type B = TypeGet<Obj, 'a.b'>; // { a: { b: number } }
 * type C = TypeGet<Obj, 'c'>; // { c: string }
 */
export type TypeGet<T, Paths> = Paths extends `${infer A}.${infer B}`
  ? A extends keyof T
    ? { [K in A]: TypeGet<T[A], B> }
    : never
  : Paths extends keyof T
    ? { [K in Paths]: T[Paths] }
    : never;

/**
 * Walk object using dot as delimiter, allows to pick multiple properties
 *
 * @example 
 * ```
 * type Obj = { a: { b: number; x: 'a' }; c: string };
 
 * type A = DeepPick<Obj, 'a'>; // { a: { b: number; x: 'a' } }
 * type B = DeepPick<Obj, 'a.b'>; // { a: { b: number } }
 * type C = DeepPick<Obj, 'c'>; // { c: string }
 * type ABC = DeepPick<Obj, 'a.b' | 'c'> // { a: { b: number } } & { c: string }
 * ```
 */
export type DeepPick<T, PathUnion extends string> =
  UnionToFnIntersection<
    PathUnion extends infer Keys ? TypeGet<T, Keys> : never
  > extends () => infer R
    ? R
    : never;

export type PartialPick<T, Keys extends keyof T> = Omit<T, Keys> & {
  [K in Keys]?: T[K];
};
