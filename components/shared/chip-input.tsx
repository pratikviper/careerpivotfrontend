"use client"

import { X } from "lucide-react"
import { useState } from "react"

import { Input } from "@/components/ui/input"

export function ChipInput({
  id,
  values,
  onChange,
  placeholder,
}: {
  id?: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState("")

  function add() {
    const next = draft.trim().replace(/,$/, "")
    if (!next) return
    if (values.some((value) => value.toLowerCase() === next.toLowerCase())) {
      setDraft("")
      return
    }
    onChange([...values, next])
    setDraft("")
  }

  return (
    <div className="space-y-2">
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
            >
              {value}
              <X className="size-3" />
              <span className="sr-only">Remove {value}</span>
            </button>
          ))}
        </div>
      ) : null}
      <Input
        id={id}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault()
            add()
          }
        }}
      />
    </div>
  )
}
