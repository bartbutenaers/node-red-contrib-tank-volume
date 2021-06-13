# node-red-contrib-tank-volume
A Node-RED node to calculate the volume of different tank types

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install bartbutenaers/node-red-contrib-tank-volume
```

## Support my Node-RED developments

Please buy my wife a coffee to keep her happy, while I am busy developing Node-RED stuff for you ...

<a href="https://www.buymeacoffee.com/bartbutenaers" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy my wife a coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Node usage

***CAUTION: I have done my best to check the accuracy of the calculations in this node, but I must assert the usual disclaimer that it is distributed without warranty, and that you use it at your own risk!***

Inject the measured height (i.e. height of the fluid or the height above the fluid) via the input message, to calculate information about the (partially) filled tank:

![Example flow](https://user-images.githubusercontent.com/14224149/121805442-a226d700-cc4b-11eb-996d-0ad0e93c2166.png)
```
[{"id":"de68ad7e.c6c5e","type":"tank-volume","z":"f3483c9d.032fa","name":"","tankType":"none","inputField":"payload","outputField":"payload","measurement":"above","inputUnit":"cm","outputUnit":"l","diameter":"","length":0,"width":0,"height":0,"length2":"","width2":"","height2":"","coneHeight":0,"cylinderHeight":0,"diameterTop":"","diameterBottom":"","x":610,"y":80,"wires":[["91cb13f3.f7e81"]]},{"id":"30bade23.bb7372","type":"inject","z":"f3483c9d.032fa","name":"Rectangular prism","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"{\"tankType\":\"rect_prism\",\"length\":400,\"width\":100,\"height\":200,\"measuredHeight\":50}","payloadType":"json","x":390,"y":120,"wires":[["de68ad7e.c6c5e"]]},{"id":"91cb13f3.f7e81","type":"debug","z":"f3483c9d.032fa","name":"Volume","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":800,"y":80,"wires":[]},{"id":"63925a8f.6c71d4","type":"inject","z":"f3483c9d.032fa","name":"Sphere","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"{\"tankType\":\"sphere\",\"diameter\":200,\"measuredHeight\":120}","payloadType":"json","x":350,"y":80,"wires":[["de68ad7e.c6c5e"]]}]
```

The ***output message*** will contain all the required information about the (partially) filled tank:
+ *totalVolume*: the total volume of the tank.
+ *filledVolume*: the volume of the tank that is filled with fluid.
+ *emptyVolume*: the volume of the tank that is empty, which means the volume of the tank above the fluid.
+ *fillPercentage*: the percentage of the tank that has been filled.
+ *emptyPercentage*: the percentage of the tank that is still empty.

## Tank types
Currently the following 13 tank types are supported:

![Tank types](https://user-images.githubusercontent.com/14224149/121801020-6a149980-cc35-11eb-8a53-d7ae0e839d9e.png)

1. ***Cone bottom***: those tanks are mostly used when total drainage of the tank is required. Or for dry materials (grains, cattle feed ...), or materials that require separation to remove the liquid from the solids. 
2. ***Cone top***
3. ***Frustrum***: truncated cone shaped tank.
4. ***Horizontal capsule***: horizontal cylinder with two hemisphere heads, for even distribution of pressure stress in the heads.
5. ***Horizontal cylinder***
6. ***Horizontal elliptical***: typical use case is an oil tank below the ground.
7. ***Horizontal oval***: typical use case is an oil tank above the ground.
8. ***Inverse piramid***: my personal use case is a stormwater subsurface infiltration well, which has been extended after a few years later (by digging a second well below the original well).
9. ***Rectangular prism (rectangular)***
10. ***Sphere***: storage of high pressure fluids, due to the even distribution of stress on the sphere surface (without weak points).
11. ***Vertical capsule***: vertical cylinder with two hemisphere heads, for even distribution of pressure stress in the heads.
12. ***Vertical cylinder***: a typical use case is a water basin at home.
13. ***Vertical oval***: typical use case is an oil tank.

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

### Tank type
For every tank type, a series of parameters need to be specified. Depending on the selected tank type, other dimension related input fields will be displayed in the config screen.  

Note that ALL these parameters need to be specified in the same unit (cm, inch, ...), as specified in the *"Input unit"* parameter on the config screen! 

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

## References

+ [omnicalculator](https://www.omnicalculator.com/construction/tank-volume) by Hanna Pamula.
