import dayjs, { Dayjs } from "dayjs";
import { z } from "zod";

export const DayjsSchema = z.coerce.string().transform(date => dayjs(date));
export const DayjsTimeSchemaRev = z.instanceof(Dayjs).transform(date => date.toISOString());
export const DayjsDateSchemaRev = z.instanceof(Dayjs).transform(date => date.format("YYYY-MM-DD"));
export const standardUndefined = <T>(x: T | undefined | null): T | undefined => x === undefined || x === null ? undefined : x;
