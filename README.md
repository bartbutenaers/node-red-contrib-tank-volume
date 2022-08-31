# node-red-contrib-tank-volume
A Node-RED node to calculate the volume of different tank types

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install node-red-contrib-tank-volume
```

## Support my Node-RED developments

Please buy my wife a coffee to keep her happy, while I am busy developing Node-RED stuff for you ...

<a href="https://www.buymeacoffee.com/bartbutenaers" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy my wife a coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Legal disclaimer

***CAUTION: this software is distributed under the Apache License Version 2.0 on an “AS IS” BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied!  Use it at your own risk!***

## Node usage

Inject the measured height (i.e. height of the fluid or the height above the fluid) via the input message, to calculate information about the (partially) filled tank:

![Example flow](https://user-images.githubusercontent.com/14224149/121805442-a226d700-cc4b-11eb-996d-0ad0e93c2166.png)
```
[{"id":"27f3134d4e2c067a","type":"inject","z":"c2a7925b.6e143","name":"Rectangular prism","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"{\"tankType\":\"rect_prism\",\"length\":400,\"width\":100,\"height\":200,\"measuredHeight\":50}","payloadType":"json","x":450,"y":940,"wires":[["1c665f48aef699cf"]]},{"id":"9bd1a940ed96ee45","type":"debug","z":"c2a7925b.6e143","name":"Volume","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":860,"y":900,"wires":[]},{"id":"d7bcee8cce12d7dd","type":"inject","z":"c2a7925b.6e143","name":"Sphere","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"{\"tankType\":\"sphere\",\"diameter\":200,\"measuredHeight\":120}","payloadType":"json","x":410,"y":900,"wires":[["1c665f48aef699cf"]]},{"id":"1c665f48aef699cf","type":"tank-volume","z":"c2a7925b.6e143","name":"","tankType":"none","inputField":"payload","outputField":"payload","measurement":"above","inputUnit1":"cm","inputUnit2":"l","outputUnit":"l","topLimit":0,"bottomLimit":0,"diameter":0,"length":0,"width":0,"height":0,"length2":0,"width2":0,"height2":0,"coneHeight":0,"cylinderHeight":0,"diameterTop":0,"diameterBottom":0,"customTable":[],"x":670,"y":900,"wires":[["9bd1a940ed96ee45"]]}]
```

The ***output message*** will contain all the required information about the (partially) filled tank:
+ *totalVolume*: the total volume of the tank, which means the nominal volume (if the tank is filled from bottom to top).
+ *filledVolume*: the volume of the tank that is filled (e.g. with fluid).
+ *emptyVolume*: the volume of the tank that is not filled, which means the volume of the tank above the fluid.  This is also called [Ullage or headspace](https://en.wikipedia.org/wiki/Ullage).
+ *usableVolume*: the part of the volume that can really be used, which means the total volume between the bottom limit and the top limit.  When bottom and top limit are both zero, then the usableVolume will be equal to the totalVolume.
+ *fillPercentage*: the percentage of the total volume that has been filled.
+ *emptyPercentage*: the percentage of the total volume that is still empty.
+ *usableFilledVolume*: the percentage of the usable volume that has been filled.
+ *usableEmptyVolume*: the percentage of the usable volume that is still empty.

## Tank types
Currently the following 13 tank types are supported:

![tank types](https://user-images.githubusercontent.com/14224149/187549203-e79405d6-f859-425c-a55a-e73f33a0ea1d.png)

1. ***Cone bottom***: those tanks are mostly used when total drainage of the tank is required. Or for dry materials (grains, cattle feed ...), or materials that require separation to remove the liquid from the solids. 
2. ***Cone top***
3. ***Frustrum***: truncated cone shaped tank.
4. ***Horizontal capsule***: horizontal cylinder with two hemisphere heads, for even distribution of pressure stress in the heads.
5. ***Horizontal cylinder***
6. ***Horizontal elliptical***: typical use case is an oil tank below the ground.
7. ***Horizontal oval***: typical use case is an oil tank above the ground.
8. ***Horizontal stadium***: [stadium](https://en.wikipedia.org/wiki/Stadium_(geometry)) shaped tank.
9. ***Inverse pyramid***: my personal use case is a stormwater subsurface infiltration well, which has been extended after a few years later (by digging a second well below the original well).
10. ***Rectangular prism (rectangular)***
11. ***Sphere***: storage of high pressure fluids, due to the even distribution of stress on the sphere surface (without weak points).
12. ***Vertical capsule***: vertical cylinder with two hemisphere heads, for even distribution of pressure stress in the heads.
13. ***Vertical cylinder***: a typical use case is a water basin at home.
14. ***Vertical oval***: typical use case is an oil tank.
15. ***Vertical stadium***: [stadium](https://en.wikipedia.org/wiki/Stadium_(geometry)) shaped tank.
16. ***Custom (table)***: the custom tank type can be selected if none of the previous types can be used.  See the section about "Custom tanks" below...

## Node properties

### Input field
Specify the field in the input message message where the settings will arrive.

### Output field
Specify the field in the output message message where the result will be send.

### Measurement
Specify how the liquid level is being measured.  When measuring the fluid in a partially filled tank, this can be done in two different ways:

![Measurement](https://user-images.githubusercontent.com/14224149/121805767-e1095c80-cc4c-11eb-9204-79a8d1e08486.png)

1. Measure the *height of the fluid*.
2. Measure the *height above the fluid*, for example using an ***ultrasonic sensor*** in combination with the [node-red-node-pisrf](https://flows.nodered.org/node/node-red-node-pisrf) node.

### Input unit
Specify the units of the tank dimensions.

### Output unit
Specify the units of the calculated volume.

### Top limit
Specify which distance - measured from the ***top*** of the tank - should not be exceeded, i.e. the fluid level should always be below this level.  See the section "Usable volume and limits" ...

*CAUTION: Note that the top limit is measured from the top (not from the bottom)!*

### Bottom limit
Specify which distance - measured from the bottom of the tank - should not be exceeded, i.e. the fluid level should always be above this level.  See the section "Usable volume and limits" ...

### Tank type
For every tank type, a series of parameters need to be specified. Depending on the selected tank type, other dimension related input fields will be displayed in the config screen.  

Note that ALL these parameters need to be specified in the same unit (cm, inch, ...), as specified in the *"Input unit"* parameter on the config screen! 

## Usable volume and limits
The total (or nominal) volume of the tank means that the tanks is completely filled from the bottom to the top.  

However in some circumstances it might be useful to have a ***bottom limit***, in case the tank is never going to be completely empty.  Some use cases:
+ When the fluid at the bottom might contain sludge.
+ When a pump is not able to empty the entire tank.
+ When the outlet of the tank is near the bottom, but a bit above the bottom.
+ ...

And in other circumstances it might be useful to have a ***top limit***, in case the tank is never going to be completely full.  Some use cases:
+ When there is a sensor at the top of the tank (which is not allowed to be submerged).
+ When some minimum empty area is required for security.
+ ...

As a result of those limits, not all the fluid in the tank can be used.  The ***usable volume*** is the part of the total volume which can really be used, which means the volume between the bottom limit and the top limit:

![Usable volume](https://user-images.githubusercontent.com/14224149/122112428-1d8db180-ce21-11eb-9f6a-845d16ceb16e.png)

Using the usable volume offers a number of advantages:
+ You know exactly how much fluid you have left.
+ You know exactly how much fluid you need to refill.
+ ...

## Custom tanks
In a lot of cases, there is no easy way to calculate the volume of a tank.  One of such cases are tanks with very complex shapes, like for example this one:

![Complex shape](https://user-images.githubusercontent.com/14224149/122114241-5b8bd500-ce23-11eb-847a-4fdbcbdcb1c2.png)

Fortunately a lot of manufacturers will offer a ***table*** with height-volume combinations, so you can easily estimate the (approximate) volume that corresponds to a certain fluid height.  This node supports such custom tank tables:

1. Select tank type *"Custom (table)"*.

2. Now the *"Custom tank"* tabsheet will become enabled.

3. Enter the height-volume combinations (from the manufacturer table) in the editable list:

   ![Custom table](https://user-images.githubusercontent.com/14224149/122115515-ddc8c900-ce24-11eb-9e14-e175067ba4be.png)

Some guidelines for configuring this table:
+ It doesn't matter if the heights are sorted, because that will be done automatically during the calculation.  But of course it will be easier to understand if you sort them already on your screen (starting with the smallest height at the bottom like in the screenshot above).
+ The largest specified height will be considered as the total height of the tank.
+ It is not needed to specify a row with `height=0` and `volume=0` (to represent the bottom of the tank), because such a row will automatically be added during the calculation anyway.
+ The height unit can be specified in the first tabsheet as *"Input unit 1"* (because that is the unit for all input length dimensions).
+ The volume unit can be specified in the first tabsheet as *"Input unit 2"* (because that is the unit for all input volume dimensions).

A custom tank table example flow:

![Custom tank example](https://user-images.githubusercontent.com/14224149/122122451-1bc9eb00-ce2d-11eb-8ae2-d963325033a5.png)
```
[{"id":"236cf173b32472a2","type":"tank-volume","z":"dd961d75822d1f62","name":"","tankType":"custom_table","inputField":"payload","outputField":"payload","measurement":"above","inputUnit1":"cm","inputUnit2":"l","outputUnit":"l","topLimit":"20","bottomLimit":"20","diameter":0,"length":0,"width":0,"height":0,"length2":0,"width2":0,"height2":0,"coneHeight":0,"cylinderHeight":0,"diameterTop":0,"diameterBottom":0,"customTable":[{"height":"100","volume":"500"},{"height":"80","volume":"400"},{"height":"60","volume":"300"},{"height":"40","volume":"200"},{"height":"20","volume":"100"}],"x":620,"y":1300,"wires":[["e7b1c16fd8fe98e9"]]},{"id":"689449def15fa9ca","type":"inject","z":"dd961d75822d1f62","name":"Measured height 50","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"{\"measuredHeight\":50}","payloadType":"json","x":390,"y":1300,"wires":[["236cf173b32472a2"]]},{"id":"e7b1c16fd8fe98e9","type":"debug","z":"dd961d75822d1f62","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":800,"y":1300,"wires":[]}]
```

Remark: the caculation will use *linear interpolation* to estimate the volume between two successive heights.

## Input message
It is possible to configure this node by injecting settings via the input message.

+ *measuredHeight*: This is probably the most used input parameter, since it contains the numeric measured height.  Which means the height of the fluid, or the height above the fluid.
+ *tankType*: When no tank type has been specified in the config screen, the input message should contain that information.
+ The dimensions parameters on the config screen can be set via the input message, if they are not specified in the config screen (i.e. no tank type specified in the config screen, or a `0` value for the dimension parameter on the config screen):
   + *diameter*
   + *length*
   + *width*
   + *height*
   + *length2*
   + *width2*
   + *height2*
   + *cone_height*
   + *cylinder_height*
   + *diameter_bottom*
   
## Tank battery
Sometimes multiple tanks are combined to create a *tank battery*, in order to have a larger oil capacity:

![tank battery](https://user-images.githubusercontent.com/14224149/187770179-f5578874-e300-4496-a2d6-41abbf6ff278.png)

In some cases these tanks are interconnected, which means the fluid level will be equal in all the tanks.  As a result it is only required to measure a single tank, and multiply the result by the number of tanks:

![tank battery flow](https://user-images.githubusercontent.com/14224149/187770008-037fb305-5d9b-4809-b462-2340da0ff5a5.png)
```
[{"id":"03eab8984ca0b78f","type":"tank-volume","z":"6063841c422bab25","name":"","tankType":"vert_stad","inputField":"payload","outputField":"payload","measurement":"fluid","inputUnit1":"cm","inputUnit2":"l","outputUnit":"l","topLimit":"10","bottomLimit":"10","diameter":0,"length":"210","width":"71.4","height":"148","length2":0,"width2":0,"height2":0,"coneHeight":0,"cylinderHeight":0,"diameterTop":0,"diameterBottom":0,"customTable":[],"x":680,"y":1340,"wires":[["a1a0d479c57ca3c4","d12e7ccddc3da34e"]]},{"id":"a1a0d479c57ca3c4","type":"debug","z":"6063841c422bab25","name":"Single tank volume","active":false,"tosidebar":true,"console":false,"tostatus":true,"complete":"payload.usableFilledVolume","targetType":"msg","statusVal":"payload","statusType":"auto","x":910,"y":1400,"wires":[]},{"id":"d12e7ccddc3da34e","type":"function","z":"6063841c422bab25","name":"Volume of 3 tanks","func":"msg.payload = msg.payload.usableFilledVolume * 3; // extract the payload from the object\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":910,"y":1340,"wires":[["0c9f41fea013eeee"]]},{"id":"0c9f41fea013eeee","type":"debug","z":"6063841c422bab25","name":"Total battery volume","active":false,"tosidebar":true,"console":false,"tostatus":true,"complete":"payload","targetType":"msg","statusVal":"payload","statusType":"auto","x":1160,"y":1400,"wires":[]},{"id":"432e5bbbdc68600a","type":"inject","z":"6063841c422bab25","name":"Set measured depth","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"60","payloadType":"num","x":470,"y":1340,"wires":[["03eab8984ca0b78f"]]}]
```

## References

+ [omnicalculator](https://www.omnicalculator.com/construction/tank-volume) by Hanna Pamula.
