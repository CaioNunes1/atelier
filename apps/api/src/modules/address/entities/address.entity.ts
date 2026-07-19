export interface AddressEntity {
  id: string;
  label: string | null;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}
