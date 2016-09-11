# homebridge-tosr0x-fan

A Homebridge plugin for controlling a 3-speed fan
with a [TOSR0X-T WiFi relay](http://www.tinyosshop.com/index.php?route=product/category&path=141_143).

Requires a [TOSR0x-T HTTP JSON API](https://github.com/jasoncodes/tosr0x-http) proxy server to be running.

## Example Homebridge Configuration


```json
"accessories": [
  {
    "accessory": "TOSR0x Fan",
    "name": "Bedroom Fan",
    "host": "localhost:8020"
  }
]
```

## Wiring Diagram

```
+-----------------+   +-----------------+
|                 |   |                 |
|   +---------+   |   |   +---------+   |   +---------+
|   |         |   |   |   |         |   |   |         |
|   | Relay 1 |   |   |   | Relay 2 |   |   | Relay 3 |
|   |         |   |   |   |         |   |   |         |
|   |         |   |   |   |         |   |   |         |
|   +-NC-C-NO-+   |   |   +-NC-C+NO-+   |   +-NC-C-NO-+
|        ^  |     |   |     |  ^  |     |     |  ^  |
|        |  |     +---------+  |  |     +-----+  |  |
|        |  |         |        |  |              |  |
+--------+  |         +--------+  |     Active --+  |
            v                     v                 v
          Fan 1                 Fan 2             Fan 3
```
