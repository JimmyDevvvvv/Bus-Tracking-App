"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bus, Clock, Users, Star, MapPin } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type BusProps = {
  bus: {
    id: string
    number: string
    route: string
    eta: number
    status: string
    capacity: string
    location: { lat: number; lng: number }
    isFavorite: boolean
  }
  isSelected: boolean
  onSelect: () => void
  onToggleFavorite: () => void
}

export function BusCard({ bus, isSelected, onSelect, onToggleFavorite }: BusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300 cursor-pointer hover:border-primary/50 card-premium",
          isSelected ? "border-primary shadow-lg shadow-primary/20" : "",
        )}
        onClick={onSelect}
      >
        <CardContent className="p-0">
          <div className="flex items-center p-5">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-3 rounded-full",
                    bus.status === "moving"
                      ? "bg-green-500/20"
                      : bus.status === "stopped"
                        ? "bg-yellow-500/20"
                        : "bg-red-500/20",
                  )}
                >
                  <Bus
                    className={cn(
                      "h-5 w-5",
                      bus.status === "moving"
                        ? "text-green-500"
                        : bus.status === "stopped"
                          ? "text-yellow-500"
                          : "text-red-500",
                    )}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{bus.number}</h3>
                    <Badge
                      variant={
                        bus.status === "moving" ? "default" : bus.status === "stopped" ? "outline" : "destructive"
                      }
                      className="ml-1"
                    >
                      {bus.status === "moving" ? "Moving" : bus.status === "stopped" ? "Stopped" : "Delayed"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{bus.route}</p>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="ml-auto relative glow"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite()
              }}
            >
              <Star
                className={cn("h-5 w-5", bus.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")}
              />
              {bus.isFavorite && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-yellow-500/10 rounded-full"
                />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-3 border-t">
            <div className="flex flex-col items-center justify-center p-3 border-r">
              <div className="flex items-center text-muted-foreground mb-1">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-xs">ETA</span>
              </div>
              <span className={cn("font-bold", bus.eta === 0 ? "text-green-500" : bus.eta <= 5 ? "text-primary" : "")}>
                {bus.eta === 0 ? "Now" : `${bus.eta} min`}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 border-r">
              <div className="flex items-center text-muted-foreground mb-1">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-xs">Capacity</span>
              </div>
              <span
                className={cn(
                  "font-bold",
                  bus.capacity === "low"
                    ? "text-green-500"
                    : bus.capacity === "medium"
                      ? "text-yellow-500"
                      : "text-red-500",
                )}
              >
                {bus.capacity === "low" ? "Low" : bus.capacity === "medium" ? "Medium" : "High"}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3">
              <div className="flex items-center text-muted-foreground mb-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-xs">Track</span>
              </div>
              <span className="font-bold text-primary">Live</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
