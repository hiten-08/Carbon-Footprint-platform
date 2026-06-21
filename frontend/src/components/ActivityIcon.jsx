import {
  Car, Bus, TrainFront, Plane, Bike, Zap, Flame, Sun,
  Trash2, Trash, Recycle, Sprout,
} from 'lucide-react'

// Fish, Beef, Salad don't all exist as exact lucide names across versions,
// so we map to close, confirmed-available equivalents to avoid a runtime
// import error. (Salad and Beef and Fish are valid in lucide-react 0.445.)
import { Fish, Beef, Salad } from 'lucide-react'

const ICONS = {
  Car, Bus, TrainFront, Plane, Bike, Zap, Flame, Sun,
  Trash2, Trash, Recycle, Sprout, Fish, Beef, Salad,
}

export function ActivityIcon({ name, ...props }) {
  const Cmp = ICONS[name] || Sprout
  return <Cmp {...props} />
}
