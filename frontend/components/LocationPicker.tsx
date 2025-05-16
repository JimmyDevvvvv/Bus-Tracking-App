// components/LocationPicker.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface Place {
  address: string
  latitude: number
  longitude: number
}

interface LocationPickerProps {
  label: string
  /** allow undefined as well as null */
  value?: Place | null
  onSelect: (place: Place | null) => void
}

export function LocationPicker({ label, value, onSelect }: LocationPickerProps) {
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 })

  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  // whenever parent gives us a new value, sync up the input text
  useEffect(() => {
    if (value != null) {
      setValue(value.address, false)
    } else {
      setValue("", false)
    }
  }, [value, setValue])

  /** click outside closes suggestions */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setOpen(true)
    onSelect(null)
  }

  const handleSelect = async (address: string) => {
    setValue(address, false)
    clearSuggestions()
    setOpen(false)
    try {
      const results = await getGeocode({ address })
      const { lat, lng } = await getLatLng(results[0])
      onSelect({ address, latitude: lat, longitude: lng })
    } catch {
      onSelect(null)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Label>{label}</Label>
      <Input
        placeholder={`Search ${label.toLowerCase()}…`}
        value={inputValue}
        onChange={handleInput}
        disabled={!ready}
      />
      {open && status === "OK" && (
        <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-background">
          {data.map((s) => (
            <li
              key={s.place_id}
              onClick={() => handleSelect(s.description)}
              className="cursor-pointer px-3 py-2 hover:bg-accent/50"
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
