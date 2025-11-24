import { Perk } from "./perks";
import { Customer } from "./user";

interface Transaction {
    _id: string,
    customer: Customer,
    perks: Perk,
    status: string;
    creation_date: string;
    update_date: string;
  }

  interface TransactionResponse {
    rows: Transaction[];
    total: number;
  }