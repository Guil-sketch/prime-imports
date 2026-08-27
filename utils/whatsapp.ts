import { CartItem } from '../types';

interface CustomerInfo {
  name: string;
  address?: string;
  notes?: string;
}

export function generateWhatsAppLink(items: CartItem[], customer: CustomerInfo): string {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5561999999999';
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  let msg = `🛒 *NOVO PEDIDO - ${process.env.NEXT_PUBLIC_STORE_NAME || 'Loja'}*\n\n`;
  msg += `👤 *Cliente:* ${customer.name}\n`;
  if (customer.address) msg += `📍 *Endereço/Entrega:* ${customer.address}\n`;
  msg += `─────────────────────────\n`;

  items.forEach((item) => {
    msg += `• *${item.quantity}x* ${item.name}\n`;
    if (item.size) msg += `  └ Tamanho/Variação: *${item.size}*\n`;
    if (item.customizationText) msg += `  └ Detalhe: _${item.customizationText}_\n`;
    msg += `  └ Subtotal: R$ ${(item.price * item.quantity).toFixed(2)}\n\n`;
  });

  msg += `─────────────────────────\n`;
  msg += `💰 *TOTAL: R$ ${total.toFixed(2)}*\n`;
  if (customer.notes) msg += `\n📝 *Obs:* ${customer.notes}\n`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}