"use client"

import * as React from "react"
import { Input } from "./input"

interface NumericInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: number
  onValueChange: (value: number) => void
}

/**
 * A custom Input component for numeric values that allows the input to be completely cleared.
 * Standard <input type="number"> often behaves weirdly when cleared in React state.
 */
export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onValueChange, className, ...props }, ref) => {
    // Internal string state to handle empty input and intermediate states (like a single decimal point)
    const [displayValue, setDisplayValue] = React.useState<string>(value.toString())

    // Sync display value when prop 'value' changes from outside
    React.useEffect(() => {
      const numericDisplay = parseFloat(displayValue)
      // Check if they are numerically different
      if (numericDisplay !== value) {
        // Special case: if value is 0 and display is empty, we consider them "in sync" 
        // to avoid jumping from "" to "0" while the user is typing.
        if (value === 0 && displayValue === "") return
        
        setDisplayValue(value.toString())
      }
    }, [value, displayValue])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      
      // regex to allow: empty string, digits, and a single period
      if (val === "" || /^\d*\.?\d*$/.test(val)) {
        setDisplayValue(val)
        
        const numericVal = parseFloat(val)
        // If empty or invalid, treat as 0 for external state
        onValueChange(isNaN(numericVal) ? 0 : numericVal)
      }
    }

    // On blur, if empty, we might want to sync back to "0" to show there's an actual value
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (displayValue === "") {
        setDisplayValue("0")
      }
      if (props.onBlur) props.onBlur(e)
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={className}
      />
    )
  }
)

NumericInput.displayName = "NumericInput"
