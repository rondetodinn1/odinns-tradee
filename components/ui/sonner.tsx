"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Disable any Sonner UI globally by rendering a no-op Toaster.
// Even if some legacy code calls toast.*, nothing will be shown.

export function Toaster() {
  return null
}

export default Toaster
