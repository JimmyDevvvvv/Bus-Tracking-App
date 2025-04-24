"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { useTheme } from "next-themes"
import { Moon, Sun, Bell, Globe, Shield, Smartphone, Palette, Trash, LogOut } from "lucide-react"
import { motion } from "framer-motion"

export default function Settings() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Customize your app experience</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="appearance">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-64">
              <TabsList className="flex flex-col items-start h-auto p-0 bg-transparent">
                <TabsTrigger value="appearance" className="w-full justify-start px-3 py-2 data-[state=active]:bg-muted">
                  <Palette className="h-4 w-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="w-full justify-start px-3 py-2 data-[state=active]:bg-muted"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="language" className="w-full justify-start px-3 py-2 data-[state=active]:bg-muted">
                  <Globe className="h-4 w-4 mr-2" />
                  Language & Region
                </TabsTrigger>
                <TabsTrigger value="privacy" className="w-full justify-start px-3 py-2 data-[state=active]:bg-muted">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy & Security
                </TabsTrigger>
                <TabsTrigger value="app" className="w-full justify-start px-3 py-2 data-[state=active]:bg-muted">
                  <Smartphone className="h-4 w-4 mr-2" />
                  App Settings
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 space-y-2">
                <Button variant="outline" className="w-full justify-start text-red-500" size="sm">
                  <Trash className="h-4 w-4 mr-2" />
                  Clear Data
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            <div className="flex-1">
              <TabsContent value="appearance" className="m-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Appearance</CardTitle>
                      <CardDescription>Customize how the app looks and feels</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <div className="flex gap-4">
                          <Button
                            variant={theme === "light" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setTheme("light")}
                          >
                            <Sun className="h-4 w-4 mr-2" />
                            Light
                          </Button>
                          <Button
                            variant={theme === "dark" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setTheme("dark")}
                          >
                            <Moon className="h-4 w-4 mr-2" />
                            Dark
                          </Button>
                          <Button
                            variant={theme === "system" ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setTheme("system")}
                          >
                            <Smartphone className="h-4 w-4 mr-2" />
                            System
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Color Scheme</Label>
                        <RadioGroup defaultValue="blue">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="blue" id="blue" />
                            <Label htmlFor="blue" className="flex items-center">
                              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2" />
                              Blue
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="purple" id="purple" />
                            <Label htmlFor="purple" className="flex items-center">
                              <div className="w-4 h-4 rounded-full bg-purple-500 mr-2" />
                              Purple
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="green" id="green" />
                            <Label htmlFor="green" className="flex items-center">
                              <div className="w-4 h-4 rounded-full bg-green-500 mr-2" />
                              Green
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Animations</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">Enable or disable animations throughout the app</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Text Size</Label>
                        <Slider defaultValue={[50]} max={100} step={10} />
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">A</span>
                          <span className="text-xs text-muted-foreground">A</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="notifications" className="m-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Notifications</CardTitle>
                      <CardDescription>Manage how and when you receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Push Notifications</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications even when the app is closed
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Notification Types</Label>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Bus Arrivals</p>
                              <p className="text-sm text-muted-foreground">Get notified when your bus is approaching</p>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Route Changes</p>
                              <p className="text-sm text-muted-foreground">
                                Get notified about route changes and detours
                              </p>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Delays</p>
                              <p className="text-sm text-muted-foreground">Get notified about bus delays</p>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Service Updates</p>
                              <p className="text-sm text-muted-foreground">
                                Get notified about general service updates
                              </p>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Quiet Hours</Label>
                          <Switch />
                        </div>
                        <p className="text-sm text-muted-foreground">Don't send notifications during these hours</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex-1">
                            <Label className="text-xs">From</Label>
                            <select className="w-full p-2 rounded-md border mt-1">
                              <option>10:00 PM</option>
                              <option>11:00 PM</option>
                              <option>12:00 AM</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">To</Label>
                            <select className="w-full p-2 rounded-md border mt-1">
                              <option>6:00 AM</option>
                              <option>7:00 AM</option>
                              <option>8:00 AM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="language" className="m-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Language & Region</CardTitle>
                      <CardDescription>Set your preferred language and regional settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <select className="w-full p-2 rounded-md border">
                          <option>English (US)</option>
                          <option>Spanish</option>
                          <option>French</option>
                          <option>German</option>
                          <option>Chinese (Simplified)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Time Format</Label>
                        <RadioGroup defaultValue="12h">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="12h" id="12h" />
                            <Label htmlFor="12h">12-hour (1:30 PM)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="24h" id="24h" />
                            <Label htmlFor="24h">24-hour (13:30)</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label>Distance Units</Label>
                        <RadioGroup defaultValue="miles">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="miles" id="miles" />
                            <Label htmlFor="miles">Miles</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="km" id="km" />
                            <Label htmlFor="km">Kilometers</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="privacy" className="m-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Privacy & Security</CardTitle>
                      <CardDescription>Manage your privacy and security settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Location Services</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">Allow the app to access your location</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Analytics</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Help improve the app by sending anonymous usage data
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Trip History</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">Save your trip history for future reference</p>
                      </div>

                      <div className="pt-4 border-t">
                        <Button variant="destructive">Delete Account</Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          This will permanently delete your account and all associated data
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="app" className="m-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>App Settings</CardTitle>
                      <CardDescription>Configure general app settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Auto-refresh Map</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Automatically refresh the map to show real-time bus locations
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Refresh Interval</Label>
                        <select className="w-full p-2 rounded-md border" defaultValue="5">
                          <option value="5">5 seconds</option>
                          <option value="10">10 seconds</option>
                          <option value="30">30 seconds</option>
                          <option value="60">1 minute</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Default View</Label>
                        </div>
                        <RadioGroup defaultValue="map">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="map" id="map" />
                            <Label htmlFor="map">Map View</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="list" id="list" />
                            <Label htmlFor="list">List View</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Gamification</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Enable achievements and rewards for using the app
                        </p>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">App Version</p>
                            <p className="text-sm text-muted-foreground">1.0.0</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Check for Updates
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
