export type OrderItem = {
  id: string;
  title: string;
  price: number;
  owner: string;
  calculatedCustoms?: number;
};

export type ItemFormValues = {
  title: string;
  price: number;
  owner: string;
};
