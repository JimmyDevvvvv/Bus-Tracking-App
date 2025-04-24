"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Bus, AlertTriangle, Check } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// Mock data for notifications
const NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Bus A1 is arriving soon",
    description: "Bus will arrive at Student Center in 3 minutes",
    time: "2 minutes ago",
    type: "arrival",
    read: false,
  },
  {
    id: "notif-2",
    title: "Route change for Bus B2",
    description: "Due to construction, Bus B2 will skip the Library stop today",
    time: "15 minutes ago",
    type: "change",
    read: false,
  },
  {
    id: "notif-3",
    title: "Bus C3 is delayed",
    description: "Bus C3 is running 10 minutes behind schedule",
    time: "30 minutes ago",
    type: "delay",
    read: true,
  },
  {
    id: "notif-4",
    title: "New bus added to North Campus route",
    description: "An additional bus has been added to improve frequency",
    time: "2 hours ago",
    type: "info",
    read: true,
  },
  {
    id: "notif-5",
    title: "Weekend schedule starts tomorrow",
    description: "Buses will run on a reduced schedule this weekend",
    time: "5 hours ago",
    type: "info",
    read: true,
  },
]

// Mock data for notification settings
const NOTIFICATION_SETTINGS = [
  {
    id: "setting-1",
    title: "Bus arrivals",
    description: "Get notified when your bus is approaching",
    enabled: true,
  },
  {
    id: "setting-2",
    title: "Route changes",
    description: "Get notified about route changes and detours",
    enabled: true,
  },
  {
    id: "setting-3",
    title: "Delays",
    description: "Get notified about bus delays",
    enabled: true,
  },
  {
    id: "setting-4",
    title: "Service updates",
    description: "Get notified about general service updates",
    enabled: false,
  },
  {
    id: "setting-5",
    title: "Weekend reminders",
    description: "Get reminded about weekend schedule changes",
    enabled: false,
  },
]

export default function Notifications() {
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const [settings, setSettings] = useState(NOTIFICATION_SETTINGS)

  useEffect(() => {
    setMounted(true)
  }, [])

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)),
    )
  }

  const unreadCount = notifications.filter((notif) => !notif.read).length

  if (!mounted) return null

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && <Badge className="bg-primary">{unreadCount} new</Badge>}
          </div>
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1">
        <div className="sticky top-[73px] bg-background/80 backdrop-blur-md z-10 px-4 py-2 border-b">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="p-4 space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                index={index}
                onMarkAsRead={() => markAsRead(notification.id)}
                onDelete={() => deleteNotification(notification.id)}
              />
            ))
          ) : (
            <EmptyState icon={Bell} title="No notifications" description="You don't have any notifications yet" />
          )}
        </TabsContent>

        <TabsContent value="unread" className="p-4 space-y-4">
          {notifications.filter((n) => !n.read).length > 0 ? (
            notifications
              .filter((notification) => !notification.read)
              .map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  index={index}
                  onMarkAsRead={() => markAsRead(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                />
              ))
          ) : (
            <EmptyState icon={Check} title="All caught up!" description="You've read all your notifications" />
          )}
        </TabsContent>

        <TabsContent value="settings" className="p-4 space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
              <div className="space-y-6">
                {settings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{setting.title}</h4>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch checked={setting.enabled} onCheckedChange={() => toggleSetting(setting.id)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Timing Preferences</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Arrival notifications</h4>
                    <p className="text-sm text-muted-foreground">How early to notify you before bus arrival</p>
                  </div>
                  <select className="bg-background border rounded-md px-3 py-1">
                    <option>5 minutes</option>
                    <option>10 minutes</option>
                    <option>15 minutes</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Quiet hours</h4>
                    <p className="text-sm text-muted-foreground">Don't send notifications during these hours</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationCard({
  notification,
  index,
  onMarkAsRead,
  onDelete,
}: {
  notification: (typeof NOTIFICATIONS)[0]
  index: number
  onMarkAsRead: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className={cn(
          "overflow-hidden transition-all duration-200",
          !notification.read && "border-primary/50 bg-primary/5",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "p-2 rounded-full mt-1",
                notification.type === "arrival"
                  ? "bg-green-500/20"
                  : notification.type === "delay"
                    ? "bg-red-500/20"
                    : notification.type === "change"
                      ? "bg-yellow-500/20"
                      : "bg-blue-500/20",
              )}
            >
              {notification.type === "arrival" ? (
                <Bus className="h-5 w-5 text-green-500" />
              ) : notification.type === "delay" ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : notification.type === "change" ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <Bell className="h-5 w-5 text-blue-500" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h3 className={cn("font-semibold", !notification.read && "text-primary")}>{notification.title}</h3>
                <span className="text-xs text-muted-foreground">{notification.time}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>

              <div className="flex items-center gap-2 mt-3">
                {!notification.read && (
                  <Button variant="ghost" size="sm" onClick={onMarkAsRead}>
                    Mark as read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: any
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-muted/50 p-4 rounded-full mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
