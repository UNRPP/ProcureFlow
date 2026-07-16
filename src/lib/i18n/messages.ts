import en from "../../../messages/en.json";
import th from "../../../messages/th.json";

import type { Locale } from "./config";

type MessageShape<T> = {
  [Key in keyof T]: T[Key] extends string ? string : MessageShape<T[Key]>;
};

export type Messages = MessageShape<typeof en>;

const dictionaries: Record<Locale, Messages> = { en, th };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}
