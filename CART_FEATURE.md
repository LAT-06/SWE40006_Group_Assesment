# Shopping Cart Feature

## Overview

A complete shopping cart implementation for the Deployma grocery e-commerce platform with a bold, neo-brutalist design aesthetic.

## Features

### 1. Shopping Cart Page

- View all items in cart with quantities and prices
- Update item quantities (increase/decrease)
- Remove items from cart
- Real-time price calculations (subtotal, delivery fee, discount, total)
- Promo code support (Try "FRESH10" for 10% off)
- Free delivery on orders over $50
- Empty cart state with call-to-action

### 2. Checkout Flow

Multi-step checkout process:

**Step 1: Shopping Cart**

- Review items and prices
- Apply promo codes
- Proceed to checkout

**Step 2: Checkout Details**

- Delivery address form
- District-based delivery fee calculation
- Delivery time slot selection
- Payment method selection
- Order summary sidebar

**Step 3: Order Confirmation**

- Success modal with order number
- Clear cart after successful order

## Files Created

### 1. `/frontend/src/stores/cart.ts`

Pinia store managing cart state:

- Cart items with quantities
- Price calculations
- Promo code validation
- Delivery fee management

### 2. `/frontend/src/views/CartView.vue`

Main cart component with:

- Responsive grid layout
- Progress indicator
- Form validation
- Interactive UI elements

### 3. Router Update

Added `/cart` route to the application

## Usage

### Navigate to Cart

```typescript
// From any component
router.push("/cart");
```

### Access Cart from Header

Click the "Cart" button in the header (shows item count badge)

### Cart Store API

```typescript
import { useCartStore } from "@/stores/cart";

const cartStore = useCartStore();

// Add item to cart
cartStore.addItem({
  name: "Organic Avocado",
  size: "4 pack",
  price: 5.99,
  quantity: 1,
  icon: "🥑",
});

// Update quantity
cartStore.updateQuantity(itemId, 1); // increase by 1
cartStore.updateQuantity(itemId, -1); // decrease by 1

// Remove item
cartStore.removeItem(itemId);

// Apply promo code
const success = cartStore.applyPromoCode("FRESH10");

// Clear entire cart
cartStore.clearCart();

// Access computed values
cartStore.subtotal; // Subtotal amount
cartStore.total; // Total with delivery and discounts
cartStore.itemCount; // Number of unique items
cartStore.totalItems; // Total quantity of all items
```

## Design System

The cart page follows the Deployma design system:

### Colors

- Background: `#fef6e4` (cream)
- Headlines: `#001858` (navy)
- Accent/Button: `#f582ae` (pink)
- Secondary: `#8bd3dd` (teal)
- Main: `#f3d2c1` (peach)
- Stroke: `#001858` (navy borders)

### Typography

- Font: DM Sans (body), Space Mono (logo)
- Bold, thick 3px borders throughout
- High contrast, neo-brutalist aesthetic

### Components

- Thick bordered cards and containers
- Hover effects with shadows
- Progress indicators
- Form inputs with validation
- Modal overlays

## Delivery Zones

The app supports district-based delivery fees:

| Zone   | Districts   | Fee   |
| ------ | ----------- | ----- |
| Zone A | 1, 3, 5     | $2.00 |
| Zone B | 2, 7, 9     | $3.50 |
| Zone C | 12, Thu Duc | $5.00 |

**Free delivery** when order total ≥ $50

## Promo Codes

- `FRESH10` - 10% discount on subtotal

## Future Enhancements

1. **Persistent Cart**
   - Save cart to Supabase
   - Sync across devices
   - Recover abandoned carts

2. **Product Integration**
   - Connect to real product catalog
   - Stock availability checks
   - Product recommendations

3. **Order History**
   - View past orders
   - Reorder functionality
   - Order tracking integration

4. **Enhanced Checkout**
   - Multiple payment gateways
   - Saved addresses
   - Delivery tracking

5. **Cart Notifications**
   - Low stock alerts
   - Price drop notifications
   - Abandoned cart emails

## Testing

To test the cart:

1. Start the development server
2. Navigate to the home page
3. Click "Cart" in the header
4. Test adding/removing items
5. Try the promo code "FRESH10"
6. Complete the checkout flow
7. Verify the success modal appears

## Mobile Responsive

The cart is fully responsive:

- Mobile: Single column layout
- Tablet: Adjusted grid
- Desktop: Two column layout (cart + summary)

Breakpoints:

- `968px`: Switches to single column
- `640px`: Stacked cart items

## Accessibility

- Semantic HTML structure
- Form labels and validation
- Keyboard navigation support
- ARIA attributes where needed
- High contrast colors

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)
