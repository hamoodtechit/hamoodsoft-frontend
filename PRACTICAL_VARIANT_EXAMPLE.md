# Practical Example: Product Variant System

## 📦 Scenario: Creating a "T-Shirt" Product

### Product Details:
- **Name:** Classic Cotton T-Shirt
- **Base Price:** $25.00
- **Unit:** Piece (pcs)
- **Brand:** Nike
- **Category:** Clothing > T-Shirts

---

## 🎨 Attributes Selected:

### Attribute 1: Color
- ✅ Red
- ✅ Blue
- ✅ Green

### Attribute 2: Size
- ✅ Small (S)
- ✅ Medium (M)
- ✅ Large (L)

### Attribute 3: Material
- ✅ Cotton
- ✅ Polyester

---

## 📊 Current System Behavior

### Auto-Generated Variants (Cartesian Product):

**Total Variants:** 3 colors × 3 sizes × 2 materials = **18 variants**

| # | Variant Name | Options | SKU | Price | Unit |
|---|--------------|---------|-----|-------|------|
| 1 | Red / S / Cotton | `{ "attr-color": "Red", "attr-size": "S", "attr-material": "Cotton" }` | (user input) | $25 (optional) | pcs (optional) |
| 2 | Red / S / Polyester | `{ "attr-color": "Red", "attr-size": "S", "attr-material": "Polyester" }` | (user input) | $25 (optional) | pcs (optional) |
| 3 | Red / M / Cotton | `{ "attr-color": "Red", "attr-size": "M", "attr-material": "Cotton" }` | (user input) | $25 (optional) | pcs (optional) |
| 4 | Red / M / Polyester | `{ "attr-color": "Red", "attr-size": "M", "attr-material": "Polyester" }` | (user input) | $25 (optional) | pcs (optional) |
| 5 | Red / L / Cotton | `{ "attr-color": "Red", "attr-size": "L", "attr-material": "Cotton" }` | (user input) | $25 (optional) | pcs (optional) |
| 6 | Red / L / Polyester | `{ "attr-color": "Red", "attr-size": "L", "attr-material": "Polyester" }` | (user input) | $25 (optional) | pcs (optional) |
| 7 | Blue / S / Cotton | `{ "attr-color": "Blue", "attr-size": "S", "attr-material": "Cotton" }` | (user input) | $25 (optional) | pcs (optional) |
| 8 | Blue / S / Polyester | `{ "attr-color": "Blue", "attr-size": "S", "attr-material": "Polyester" }` | (user input) | $25 (optional) | pcs (optional) |
| 9 | Blue / M / Cotton | `{ "attr-color": "Blue", "attr-size": "M", "attr-material": "Cotton" }` | (user input) | $25 (optional) | pcs (optional) |
| 10 | Blue / M / Polyester | `{ "attr-color": "Blue", "attr-size": "M", "attr-material": "Polyester" }` | (user input) | $25 (optional) | pcs (optional) |
| 11 | Blue / L / Cotton | `{ "attr-color": "Blue", "attr-size": "L", "attr-material": "Cotton" }` | (user input) | $25 (optional) | pcs (optional) |
| 12 | Blue / L / Polyester | `{ "attr-color": "Blue", "attr-size": "L", "attr-material": "Polyester" }` | (user input) | $25 (optional) | pcs (optional) |
| 13 | Green / S / Cotton | `{ "attr-color": "Green", "attr-size": "S", "attr-material": "Cotton" }` | (user input) | $25 (optional) | pcs (optional) |
| 14 | Green / S / Polyester | `{ "attr-color": "Green", "attr-size": "S", "attr-material": "Polyester" }` | (user input) | $25 (optional) | pcs (optional) |
| 15 | Green / M / Cotton | `{ "attr-color": "Green", "attr-size": "M", "attr-material": "Cotton" }` | (user input) | $25 (optional) | pcs (optional) |
| 16 | Green / M / Polyester | `{ "attr-color": "Green", "attr-size": "M", "attr-material": "Polyester" }` | (user input) | $25 (optional) | pcs (optional) |
| 17 | Green / L / Cotton | `{ "attr-color": "Green", "attr-size": "L", "attr-material": "Cotton" }` | (user input) | $25 (optional) | pcs (optional) |
| 18 | Green / L / Polyester | `{ "attr-color": "Green", "attr-size": "L", "attr-material": "Polyester" }` | (user input) | $25 (optional) | pcs (optional) |

**Note:** Each variant now has editable SKU, Price, and Unit fields for stock management. SKUs must be unique across all variants.

---

## ⚠️ Problems with Current System:

### Problem 1: Too Many Variants
- User might not want all 18 combinations
- Some combinations don't make sense (e.g., "Green / S / Polyester" might not be in stock)
- Creates unnecessary database records

### Problem 2: No Customization Per Variant
- Can't set different prices per variant
- Can't exclude specific combinations
- All variants get same base price

### Problem 3: Manual Work After Creation
- Must edit each variant individually after product is created
- No way to preview and adjust before submission

---

## ✅ Improved System (With Recommendations)

### Step 1: Attribute Selection
```
Selected Attributes:
✓ Color: Red, Blue, Green (3 values)
✓ Size: S, M, L (3 values)
✓ Material: Cotton, Polyester (2 values)

⚠️ Warning: This will create 18 variants. Continue?
[Cancel] [Continue]
```

### Step 2: Variant Preview with Controls

```
┌─────────────────────────────────────────────────────────────┐
│ Variants Preview (18 variants will be created)               │
│ [✓ Select All] [✗ Deselect All] [Clear All]                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ☑ Variant 1: Red / S / Cotton                               │
│    Options: Color: Red | Size: S | Material: Cotton         │
│    Variant Name: [Red / S / Cotton]                          │
│    SKU: [TSHIRT-RED-S-COTTON] (required for stock)           │
│    Price: [$25.00] (optional, uses product price if empty)   │
│    Unit: [pcs▼] (optional, uses product unit if empty)        │
│    [✕ Remove] [✏️ Edit]                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ☑ Variant 2: Red / S / Polyester                           │
│    Options: Color: Red | Size: S | Material: Polyester      │
│    SKU: [TSHIRT-RED-S-POLY_____]  Price: [$23.00]  Unit: [pcs▼] │
│    [✕ Remove] [✏️ Edit]                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ☐ Variant 3: Red / M / Cotton                               │
│    Options: Color: Red | Size: M | Material: Cotton         │
│    SKU: [TSHIRT-RED-M-COTTON____]  Price: [$25.00]  Unit: [pcs▼] │
│    [✕ Remove] [✏️ Edit]                                      │
│    ⚠️ This variant is excluded and won't be created         │
└─────────────────────────────────────────────────────────────┘

... (15 more variants)
```

### Step 3: Bulk Actions Example

```
Selected: 5 variants

Bulk Actions:
[Set Price for All] [Set Unit for All] [Generate SKUs] [Delete Selected]

┌─────────────────────────────────────────────────────────────┐
│ Bulk Price Update                                            │
│ Set price for all selected variants: [$____]                │
│ [Cancel] [Apply to 5 variants]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Real-World Use Cases

### Use Case 1: Excluding Unavailable Combinations

**Scenario:** Store doesn't have Green color in Small size

**Current System:**
- Creates all 18 variants
- Must delete unwanted variants after creation
- Or manually exclude Green/Small combinations (but system doesn't support this)

**Improved System:**
```
User unchecks:
☐ Green / S / Cotton
☐ Green / S / Polyester

Result: Only 16 variants created (instead of 18)
```

---

### Use Case 2: Different Prices Per Variant

**Scenario:** 
- Cotton variants: $25.00
- Polyester variants: $23.00 (cheaper material)
- Large size: +$2.00 premium

**Current System:**
- All variants get base price ($25)
- Must edit each variant individually after creation

**Improved System:**
```
Bulk Actions:
1. Select all Polyester variants (9 variants)
2. Click "Set Price for Selected"
3. Enter: $23.00
4. Apply

5. Select all Large size variants (6 variants)
6. Click "Adjust Price" → "+$2.00"
7. Apply

Result:
- Small/Medium Cotton: $25.00
- Small/Medium Polyester: $23.00
- Large Cotton: $27.00
- Large Polyester: $25.00
```

---

### Use Case 3: Custom SKU Generation

**Scenario:** Need specific SKU format: `TSHIRT-{COLOR}-{SIZE}-{MATERIAL}`

**Current System:**
- SKUs are auto-generated or manual entry
- Must edit each variant individually

**Improved System:**
```
Bulk Actions → Generate SKUs

Pattern: TSHIRT-{color}-{size}-{material}
Case: UPPERCASE

Result:
- TSHIRT-RED-S-COTTON
- TSHIRT-RED-S-POLYESTER
- TSHIRT-RED-M-COTTON
... (automatically generated for all variants)
```

---

### Use Case 4: Template Reuse

**Scenario:** Store sells multiple T-shirt products with same variant structure

**Current System:**
- Must select attributes and values for each product
- Repeat the same process every time

**Improved System:**
```
Saved Template: "T-Shirt Standard Variants"

Attributes:
- Color: Red, Blue, Green
- Size: S, M, L
- Material: Cotton, Polyester

[Apply Template] → Instantly generates 18 variants
[Edit Template] → Adjust before applying
```

---

## 📋 Example: Complete Product Creation Flow

### Step-by-Step with Improvements:

#### 1. Basic Product Info
```
Product Name: Classic Cotton T-Shirt
Description: Comfortable everyday t-shirt
Base Price: $25.00
Unit: Piece (pcs)
Brand: Nike
Category: Clothing > T-Shirts
```

#### 2. Select Attributes
```
☑ Color
   Values: Red, Blue, Green
   [Edit Values] [+ Add Value]

☑ Size
   Values: S, M, L
   [Edit Values] [+ Add Value]

☑ Material
   Values: Cotton, Polyester
   [Edit Values] [+ Add Value]

Summary: 3 attributes selected → 18 variants will be created
[Continue] [Cancel]
```

#### 3. Variant Preview & Customization
```
┌─────────────────────────────────────────────────────────────┐
│ Variants Preview (18 variants)                                │
│ Showing 1-10 of 18                                           │
│ [← Previous] [Next →]                                        │
└─────────────────────────────────────────────────────────────┘

Selected: 18 | Excluded: 0

[Select All] [Deselect All] [Bulk Edit] [Clear All]

Variant Cards (with checkboxes):
☑ Red / S / Cotton      SKU: [____]  Price: [$25.00]  [✕] [✏️]
☑ Red / S / Polyester   SKU: [____]  Price: [$23.00]  [✕] [✏️]
☑ Red / M / Cotton      SKU: [____]  Price: [$25.00]  [✕] [✏️]
...
```

#### 4. Bulk Actions
```
Selected 9 variants (all Polyester)

Bulk Actions:
[Set Price: $23.00] [Set Unit: pcs] [Generate SKUs] [Delete]

Click "Set Price: $23.00"
→ All 9 Polyester variants now have $23.00 price
```

#### 5. Final Review
```
┌─────────────────────────────────────────────────────────────┐
│ Review Before Creating                                       │
│                                                              │
│ Product: Classic Cotton T-Shirt                              │
│ Variants: 18 (all selected)                                 │
│                                                              │
│ Price Range: $23.00 - $27.00                                 │
│ SKUs: 18 (all auto-generated)                                │
│                                                              │
│ [← Back] [Create Product]                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Code Example: Selective Variant Generation

```typescript
// State for excluded variants
const [excludedVariants, setExcludedVariants] = useState<number[]>([])

// Generate variants
const allVariants = useMemo(() => {
  const combinations = cartesianProduct(valueArrays)
  return combinations.map((combination) => {
    const options: Record<string, string> = {}
    const variantNameParts: string[] = []
    
    combination.forEach(({ attributeId, attributeName, value }) => {
      const key = `attr-${attributeName.toLowerCase().replace(/\s+/g, "-")}`
      options[key] = value
      variantNameParts.push(value)
    })
    
    return {
      variantName: variantNameParts.join(" / "),
      options,
    }
  })
}, [selectedAttributeIds, availableAttributes])

// Filter out excluded variants
const activeVariants = allVariants.filter((_, index) => 
  !excludedVariants.includes(index)
)

// In the UI
{allVariants.map((variant, index) => (
  <Card key={index}>
    <Checkbox
      checked={!excludedVariants.includes(index)}
      onCheckedChange={(checked) => {
        if (checked) {
          setExcludedVariants(prev => prev.filter(i => i !== index))
        } else {
          setExcludedVariants(prev => [...prev, index])
        }
      }}
    />
    <VariantDetails variant={variant} index={index} />
  </Card>
))}
```

---

## 📊 Comparison Table

| Feature | Current System | Improved System |
|---------|---------------|-----------------|
| **Variant Count** | Always creates all combinations | Can exclude specific variants |
| **Price Customization** | Same price for all | Different prices per variant |
| **Bulk Actions** | ❌ Not available | ✅ Available |
| **SKU Generation** | Manual or auto (same pattern) | Custom patterns, bulk generation |
| **Preview** | Read-only | Editable before creation |
| **Templates** | ❌ Not available | ✅ Save and reuse |
| **Validation** | Basic | Advanced (duplicates, warnings) |
| **User Control** | Limited | Full control |

---

## 🎯 Key Takeaways

1. **Current System:** Creates all combinations automatically (18 variants)
2. **Problem:** No way to exclude unwanted combinations
3. **Solution:** Add checkboxes to exclude variants before creation
4. **Bonus:** Bulk actions for faster customization
5. **Result:** More flexible, user-friendly variant management

---

## 🚀 Next Steps

1. Implement variant exclusion (checkboxes)
2. Add bulk price/unit updates
3. Add SKU pattern generation
4. Add variant count warning
5. Add variant templates

This makes the system much more practical for real-world use! 🎉
