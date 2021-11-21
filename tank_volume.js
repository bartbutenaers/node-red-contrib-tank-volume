/**
 * Copyright 2021 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
 module.exports = function(RED) {
    var settings = RED.settings;
    const convert = require('convert-units');
    const path = require('path');   

    function TankVolumeNode(config) {
        RED.nodes.createNode(this, config);
        this.inputField        = config.inputField;
        this.measurement       = config.measurement;
        this.outputField       = config.outputField;  
        this.inputUnit1        = config.inputUnit1;
        this.inputUnit2        = config.inputUnit2;
        this.outputUnit        = config.outputUnit;
        this.topLimit          = parseInt(config.topLimit);
        this.bottomLimit       = parseInt(config.bottomLimit);
        this.tankType          = config.tankType;
        this.diameter          = parseFloat(config.diameter);
        this.length            = parseFloat(config.length);
        this.width             = parseFloat(config.width);
        this.height            = parseFloat(config.height);
        this.length2           = parseFloat(config.length2);
        this.width2            = parseFloat(config.width2);
        this.height2           = parseFloat(config.height2);
        this.coneHeight        = parseFloat(config.coneHeight);  
        this.cylinderHeight    = parseFloat(config.cylinderHeight);
        this.diameterTop       = parseFloat(config.diameterTop);
        this.diameterBottom    = parseFloat(config.diameterBottom);
        this.customTable       = config.customTable || [];

        var node = this;
        
        if (this.tankType == "") this.tankType = "none";
        
        // A few resources:
        // https://keisan.casio.com/menu/system/000000000280
        // https://www.omnicalculator.com/construction/tank-volume
        // https://ijret.org/volumes/2016v05/i04/IJRET20160504001.pdf
                
        function getTotalVolumeHorizonalCylinder(radius, length) {
            if (radius == undefined) throw "The diameter of the horizontal cylinder is undefined";
            if (length == undefined) throw "The length of the horizontal cylinder is undefined";
            
            return Math.PI * Math.pow(radius, 2) * length;
        }
        
        function getPartialVolumeHorizonalCylinder(radius, length, fluidHeight) {
            if (radius == undefined) throw "The diameter of the horizontal cylinder is undefined";
            if (length == undefined) throw "The length of the horizontal cylinder is undefined";
            if (fluidHeight == undefined) throw "The fill level of the horizontal cylinder is undefined";
         
            var angle = 2 * Math.acos((radius - fluidHeight) / radius); // See θ
            return 0.5 * Math.pow(radius, 2) * (angle - Math.sin(angle)) * length;
        }
        
        function getTotalVolumeVerticalCylinder(radius, height) {
            if (radius == undefined) throw "The diameter of the vertical cylinder is undefined";
            if (height == undefined) throw "The height of the vertical cylinder is undefined";
            
            return Math.PI * Math.pow(radius, 2) * height;
        }
        
        function getPartialVolumeVerticalCylinder(radius, fluidHeight) {
            if (radius == undefined) throw "The diameter of the vertical cylinder is undefined";
            if (fluidHeight == undefined) throw "The fill level of the vertical cylinder is undefined";
        
            return Math.PI * Math.pow(radius, 2) * fluidHeight;
        }        
        
        function getTotalVolumeRectangularPrism(width, length, height) {
            if (width == undefined) throw "The width of the rectangular prism is undefined";
            if (length == undefined) throw "The length of the rectangular prism is undefined";
            if (height == undefined) throw "The height of the rectangular prismr is undefined";
            
            return height * width * length;
        }
        
        function getPartialVolumeRectangularPrism(width, length, fluidHeight) {
            if (width == undefined) throw "The width of the rectangular prism is undefined";
            if (length == undefined) throw "The length of the rectangular prism is undefined";
            if (fluidHeight == undefined) throw "The fill level of the rectangular prism is undefined";
        
            return fluidHeight * width * length;
        } 

        function getTotalVolumeConeTop(coneHeight, cylinderHeight, radiusTop, radiusBottom) {
            if (coneHeight == undefined) throw "The cone height of the cone top is undefined";
            if (cylinderHeight == undefined) throw "The cylinder height of the cone top is undefined";
            if (radiusTop == undefined) throw "The diameter top of the cone top is undefined";
            if (radiusBottom == undefined) throw "The diameter bottom of the cone top is undefined";
            
            // Add the volume of the frustum part to the volume of the cylindrical part.
            return getTotalVolumeVerticalCylinder(radiusBottom, cylinderHeight) + getTotalVolumeFrustrum(coneHeight, radiusBottom, radiusTop);
        }
        
        function getPartialVolumeConeTop(coneHeight, cylinderHeight, radiusTop, radiusBottom, fluidHeight) {
            if (coneHeight == undefined) throw "The cone height of the cone top is undefined";
            if (cylinderHeight == undefined) throw "The cylinder height of the cone top is undefined";
            if (radiusTop == undefined) throw "The diameter top of the cone top is undefined";
            if (radiusBottom == undefined) throw "The diameter bottom of the cone top is undefined";
            if (fluidHeight == undefined) throw "The fill level of the cone top is undefined";
        
            if (fluidHeight <= cylinderHeight) {
                return getPartialVolumeVerticalCylinder(radiusBottom, fluidHeight);
            }
            else {
                var frustrum_fluidHeight = fluidHeight - cylinderHeight;
                
                var frustrumVolume = getPartialVolumeFrustrum(coneHeight, radiusTop, radiusBottom, frustrum_fluidHeight);
                
                return getTotalVolumeVerticalCylinder(radiusBottom, cylinderHeight) + frustrumVolume;
            }
        }           
        
        function getTotalVolumeConeBottom(coneHeight, cylinderHeight, radiusTop, radiusBottom) {
            if (coneHeight == undefined) throw "The cone height of the cone bottom is undefined";
            if (cylinderHeight == undefined) throw "The cylinder height of the cone bottom is undefined";
            if (radiusTop == undefined) throw "The diameter top of the cone bottom is undefined";
            if (radiusBottom == undefined) throw "The diameter bottom of the cone bottom is undefined";
            
            // Add the volume of the frustum part to the volume of the cylindrical part
            return getTotalVolumeFrustrum(coneHeight, radiusTop, radiusBottom) + getTotalVolumeVerticalCylinder(radiusTop, cylinderHeight);
        }
        
        function getPartialVolumeConeBottom(coneHeight, cylinderHeight, radiusTop, radiusBottom, fluidHeight) {
            if (coneHeight == undefined) throw "The cone height of the cone bottom is undefined";
            if (cylinderHeight == undefined) throw "The cylinder height of the cone bottom is undefined";
            if (radiusTop == undefined) throw "The diameter top of the cone bottom is undefined";
            if (radiusBottom == undefined) throw "The diameter bottom of the cone bottom is undefined";
            if (fluidHeight == undefined) throw "The fill level of the cone bottom is undefined";
        
            if (fluidHeight <= coneHeight) {
                return getPartialVolumeFrustrum(coneHeight, radiusTop, radiusBottom, fluidHeight);
            }
            else {
                var cylinder_fluidHeight = fluidHeight - coneHeight;
                return getTotalVolumeFrustrum(coneHeight, radiusTop, radiusBottom) + getPartialVolumeVerticalCylinder(radiusTop, cylinder_fluidHeight);
            }
        }         
        
        function getTotalVolumeInversePiramid(width, length, height, width2, length2, height2) {
            if (width == undefined) throw "The width of the rectangular prism is undefined";
            if (length == undefined) throw "The length of the rectangular prism is undefined";
            if (height == undefined) throw "The height of the rectangular prismr is undefined";
            if (width == undefined) throw "The width 2 of the rectangular prism is undefined";
            if (length == undefined) throw "The length 2 of the rectangular prism is undefined";
            if (height == undefined) throw "The height 2 of the rectangular prismr is undefined";
            
            return getTotalVolumeRectangularPrism(width2, length2, height2) + getTotalVolumeRectangularPrism(width, length, height);
        }
        
        function getPartialVolumeInversePiramid(width, length, height, width2, length2, height2, fluidHeight) {
            if (width == undefined) throw "The width of the rectangular prism is undefined";
            if (length == undefined) throw "The length of the rectangular prism is undefined";
            if (fluidHeight == undefined) throw "The fill level of the rectangular prism is undefined";
        
            if (fluidHeight <= height2) {
                return getPartialVolumeRectangularPrism(width2, length2, fluidHeight);
            }
            else {
                var fluidHeight1 = fluidHeight - height2;
                return getTotalVolumeRectangularPrism(width2, length2, height2) + getPartialVolumeRectangularPrism(width, length, fluidHeight1);
            }
        }         

        function getTotalVolumeHorizontalCapsule(radius, length) {
            if (radius == undefined) throw "The diameter of the horizontal capsule is undefined";
            if (length == undefined) throw "The length of the horizontal capsule is undefined";
            
            return Math.PI * Math.pow(radius, 2) * ((4/3) * radius + length);
        }
        
        function getPartialVolumeHorizontalCapsule(radius, length, fluidHeight) {
            if (radius == undefined) throw "The diameter of the horizontal capsule is undefined";
            if (length == undefined) throw "The length of the horizontal capsule is undefined";
            if (fluidHeight == undefined) throw "The fill level of the horizontal capsule is undefined";
        
            var angle = 2 * Math.acos((radius - fluidHeight) / radius); // See θ
            // V_horizontal_cylinder_fluidHeight + V_spherical_cap_fluidHeight
            return 0.5 * Math.pow(radius, 2) * (angle - Math.sin(angle)) * length + ((Math.PI * Math.pow(fluidHeight, 2)) / 3) * ((3 * radius) - fluidHeight);
        }        

        function getTotalVolumeVerticalCapsule(radius, length) {
            if (radius == undefined) throw "The diameter of the vertical capsule is undefined";
            if (length == undefined) throw "The length of the vertical capsule is undefined";
            
            return Math.PI * Math.pow(radius, 2) * ((4/3) * radius + length);
        }
        
        function getPartialVolumeVerticalCapsule(radius, length, fluidHeight) {
            if (radius == undefined) throw "The diameter of the vertical capsule is undefined";
            if (length == undefined) throw "The length of the vertical capsule is undefined";
            if (fluidHeight == undefined) throw "The fill level of the vertical capsule is undefined";
        
            if (fluidHeight < radius) {
                // The liquid is only in the bottom hemisphere part
                return ((Math.PI * Math.pow(fluidHeight, 2)) / 3) * ((3 * radius) - fluidHeight);
            }
            else if (radius < fluidHeight && fluidHeight < radius + length) {
                // Add the hemisphere volume and "shorter" cylinder
                var fluidHeightCylinder = fluidHeight - radius;
                return (2/3) * Math.PI * Math.pow(radius, 3) + Math.PI * Math.pow(radius, 2) * fluidHeightCylinder;
            }
            else { // diameter/2 + length < fluidHeight
                // Add the hemisphere volume and cylinder volume and part of upper hemisphere volume
                // See formula 13 in https://ijret.org/volumes/2016v05/i04/IJRET20160504001.pdf
                var fluidHeightHemisphere = fluidHeight - radius - length;
                return (2/3) * Math.PI * Math.pow(radius, 3) + Math.PI * Math.pow(radius, 2) * length + ((Math.PI / 12) * ((3 * Math.pow(2 * radius, 2) * fluidHeightHemisphere) - (4 * Math.pow(fluidHeightHemisphere, 3))));
            }   
        }    

        function getTotalVolumeOval(width, length, height) {
            if (width == undefined) throw "The width of the oval is undefined";
            if (length == undefined) throw "The length of the oval is undefined";
            if (height == undefined) throw "The height of the oval is undefined";
            
            return Math.PI * width * length * height / 4;
        }
        
        function getPartialVolumeOval(width, length, height, fluidHeight) {
            if (width == undefined) throw "The width of the oval is undefined";
            if (length == undefined) throw "The length of the oval is undefined";
            if (height == undefined) throw "The height of the oval is undefined";
            if (fluidHeight == undefined) throw "The fill level of the oval is undefined";
            
            return length * height * width /4 * (Math.acos(1 - (2 * fluidHeight / height)) - (1 - (2 * fluidHeight / height)) * Math.sqrt((4 * fluidHeight / height - 4 * Math.pow(fluidHeight, 2) / Math.pow(height, 2))));
        }
        
        function getTotalVolumeFrustrum(height, radiusTop, radiusBottom) {
            if (height == undefined) throw "The height of the frustrum is undefined";
            if (radiusTop == undefined) throw "The diameter top of the frustrum is undefined";
            if (radiusBottom == undefined) throw "The diameter bottom of the frustrum is undefined";
           
            // See formula calculation here https://www.sccollege.edu/Departments/MATH/Documents/Math%20185/06-02-048_Volumes.pdf
            return (1/3) * Math.PI * height * (Math.pow(radiusTop, 2) + radiusTop * radiusBottom + Math.pow(radiusBottom, 2));
        }
        
        function getPartialVolumeFrustrum(height, radiusTop, radiusBottom, fluidHeight) {
            if (height == undefined) throw "The height of the frustrum is undefined";
            if (radiusTop == undefined) throw "The diameter top of the frustrum is undefined";
            if (radiusBottom == undefined) throw "The diameter bottom of the frustrum is undefined";
            if (fluidHeight == undefined) throw "The fill level of the frustrum is undefined";
            
            // Note that this formule is only valid for limited cases !!!!
            if (radiusTop === radiusBottom) throw "The diameter top should be different from the diameter bottom (otherwise it becomes a cylinder...)";
            
            var z, radius_fluidHeight;
 
            // Calculate the top radius of the fluidHeight part, based on triangles similarity...
            z = height * radiusBottom / (radiusTop - radiusBottom);
            radius_fluidHeight = radiusTop * (fluidHeight + z) / (height + z);

            if (radiusTop > radiusBottom) {
                return  (1/3) * Math.PI * height * (Math.pow(radius_fluidHeight, 2) + radius_fluidHeight * radiusBottom + Math.pow(radiusBottom, 2));
            }
            else {
                // It is not clear on https://www.omnicalculator.com/construction/tank-volume that the fluidHeight need to be used (instead of height)
                // for a "cone top" tank.  I could not find the correct formula anywhere, so had to figure it out on my own.  Seems to be working correctly ...
                return  (1/3) * Math.PI * fluidHeight * (Math.pow(radius_fluidHeight, 2) + radius_fluidHeight * radiusBottom + Math.pow(radiusBottom, 2));
            }
        } 
        
        function getTotalVolumeSphere(radius) {
            if (radius == undefined) throw "The diameter of the sphere is undefined";
           
            return Math.PI * Math.pow(radius, 3) * 4 / 3;
        }
        
        function getPartialVolumeSphere(radius, fluidHeight) {
            if (radius == undefined) throw "The diameter of the sphere is undefined";
            if (fluidHeight == undefined) throw "The fill level of the sphere is undefined";
        
            // https://www.onlineconversion.com/object_volume_partial_sphere.htm
            return Math.PI * Math.pow(fluidHeight, 2) * radius - Math.PI * Math.pow(fluidHeight, 3) / 3;
        }

        function getTotalVolumeHorizontalElliptical(radius, length) {
            if (radius == undefined) throw "The diameter of the horizontal elliptical is undefined";
            if (length == undefined) throw "The length of the horizontal elliptical is undefined";
           
            return getPartialVolumeHorizontalElliptical(radius, length, 2 * radius);
        }
        
        function getPartialVolumeHorizontalElliptical(radius, length, fluidHeight) {
            if (radius == undefined) throw "The diameter of the horizontal elliptical is undefined";
            if (length == undefined) throw "The length of the horizontal elliptical is undefined";
            if (fluidHeight == undefined) throw "The fill level of the horizontal elliptical is undefined";
        
            var diameter = 2 * radius;
            var C = 0.5; // ASME 2:1 (Elliptical heads)
         
            // https://neutrium.net/equipment/volume-and-wetted-area-of-partially-filled-horizontal-vessels/
            var volumeHead = Math.pow(diameter, 3) * C * (Math.PI / 12) * ((3 * Math.pow(fluidHeight / diameter, 2)) - (2 * Math.pow(fluidHeight / diameter, 3)));
            
            return 2 * volumeHead +  + getPartialVolumeHorizonalCylinder(radius, length, fluidHeight);
        }
        
        function getTotalVolumeCustomTable(customTable) {
            // The last volume in the row will be considered as the total volume ...
            var lastRow = customTable[customTable.length-1];
            return lastRow.volume;
        }

        function getPartialVolumeCustomTable(customTable, fluidHeight) {
            for (var i = 1; i < customTable.length; i++) {
                var previousRow = customTable[i-1];
                var currentRow = customTable[i];
                
                if(fluidHeight >= previousRow.height && fluidHeight <= currentRow.height) {
                    // Calculate the volume via linear interpolation (https://en.wikipedia.org/wiki/Linear_interpolation)
                    return previousRow.volume + (fluidHeight - previousRow.height) * (currentRow.volume - previousRow.volume) / (currentRow.height - previousRow.height)
                }
            }
        }
        
        node.on("input", function(msg) {
            var input;
            var fluidHeight = 0;
            var tankHeight = 0;
            var totalVolume = 0;
            var filledVolume = 0;
            var minimumVolume = 0;
            var maximumVolume = 0;

            // Copy the tank dimensions and limits
            var topLimit        = node.topLimit;
            var bottomLimit     = node.bottomLimit;
            var diameter        = node.diameter;
            var length          = node.length;
            var width           = node.width;
            var height          = node.height;
            var length2         = node.length2;
            var width2          = node.width2;
            var height2         = node.height2;
            var coneHeight      = node.coneHeight;
            var cylinderHeight  = node.cylinderHeight;
            var diameterTop     = node.diameterTop;
            var diameterBottom  = node.diameterBottom;
            // Deep clone the custom table, to avoid converting the same tank dimensions over and over again.
            // See https://github.com/bartbutenaers/node-red-contrib-tank-volume/issues/3
            var customTable     = JSON.parse(JSON.stringify(node.customTable));
            
            try {
                input = RED.util.getMessageProperty(msg, node.inputField);
            } 
            catch(err) {
                node.error("The input cannot be read from input msg." + node.inputField);
                return;
            }
            
            if (typeof input === 'object' && input !== null) {
                // Settings from input msg override the config screen settings, when the latter one are 0.
                // This means that 0 dimensions are not allowed on the config screen!!!
                diameter        = diameter        || input.diameter;
                length          = length          || input.length;
                width           = width           || input.width;
                height          = height          || input.height;
                length2         = length2         || input.length2;
                width2          = width2          || input.width2;
                height2         = height2         || input.height2;
                coneHeight      = coneHeight      || input.cone_height;
                cylinderHeight  = cylinderHeight  || input.cylinder_height;
                diameterTop     = diameterTop     || input.diameter_top;
                diameterBottom  = diameterBottom  || input.diameter_bottom;
                
                // The measured height always arrives via the input message, never via the config screen
                measuredHeight  = input.measuredHeight;
                
                if (customTable.length === 0) {
                    customTable = input.customTable || [];
                }
            }
            else if (!isNaN(input)) {
                // The input can be a single number, representing the measured height
                measuredHeight = input;
            }
            else {
                node.error("The input cannot only be a number or a Javascript object");
                return;
            }
            
            if (node.tankType === "custom_table") {
                if (!customTable || !Array.isArray(customTable) || customTable.length === 0) {
                    node.error("The custom table should contain at least one row");
                    return;                    
                }
                
                if (customTable.length === 1 && customTable[0].height == 0) {
                    node.error("When the custom table contains one row, then height 0 is not allowed");
                    return;                    
                }
                
                // TODO check whether each array element has a height and a volume property
                
                // Sort the custom table by ascending height
                customTable.sort(function(row1, row2) {
                    return parseFloat(row1.height) - parseFloat(row2.height);
                });
                
                if (customTable[0].height == 0) {
                    if (customTable[0].volume != 0) {
                        node.error("The volume of height 0 should also be 0 in the custom table");
                        return;
                    }                        
                }
                else {
                    // The table should start with height 0
                    customTable.unshift({height:0, volume:0});
                }
            }
            
            // From here on we work with radius (instead of diameter), to simplify the formula's...
            var radius = diameter / 2;
            var radiusTop = diameterTop / 2;
            var radiusBottom = diameterBottom / 2;
            
            // When input dimensions (2D) and limits are specified in another dimension, convert them to centimeter
            if (node.inputUnit1 !== "cm") {
                topLimit        = convert(topLimit).from(node.inputUnit1).to('cm');
                bottomLimit     = convert(bottomLimit).from(node.inputUnit1).to('cm');
                diameter        = convert(diameter).from(node.inputUnit1).to('cm');
                length          = convert(length).from(node.inputUnit1).to('cm');
                width           = convert(width).from(node.inputUnit1).to('cm');
                height          = convert(height).from(node.inputUnit1).to('cm');
                length2         = convert(length2).from(node.inputUnit1).to('cm');
                width2          = convert(width2).from(node.inputUnit1).to('cm');
                height2         = convert(height2).from(node.inputUnit1).to('cm');
                coneHeight      = convert(coneHeight).from(node.inputUnit1).to('cm');
                cylinderHeight  = convert(cylinderHeight).from(node.inputUnit1).to('cm');
                diameterTop     = convert(diameterTop).from(node.inputUnit1).to('cm');
                diameterBottom  = convert(diameterBottom).from(node.inputUnit1).to('cm');
                measuredHeight  = convert(measuredHeight).from(node.inputUnit1).to('cm');
                
                // Convert the unit of every height in the custom table
                customTable.forEach(function(row, index, array) {
                    row.height = convert(row.height).from(node.inputUnit1).to('cm');
                });
            }   

            // When input dimensions (3D) are specified in another dimension, convert them to cm3.
            // Currently this is only used for the volumes in the custom table...
            if (node.inputUnit2 !== "cm3") {
                // Convert the unit of every volume in the custom table
                customTable.forEach(function(row, index, array) {
                    row.volume = convert(row.volume).from(node.inputUnit2).to('cm3');
                });
            }

            var tankType = node.tankType;
            
            // When no tank type specified on the config screen, thrn it should be specified in the input message
            if (tankType ==="none") {
                if (input.tankType) {
                    tankType = input.tankType;
                }
                else {
                     node.warn("No tank type specified in the input message");
                    return;
                }
            }
            
            // Calculate the total tank height, depending on the tank type
            switch(tankType) {
                case "horiz_cylin":
                    tankHeight = length;
                    break;
                case "vert_cylin":
                    tankHeight = 2 * radius;
                    break;
                case "rect_prism":
                    tankHeight = height;
                    break;
                case "cone_top":
                    tankHeight = cylinderHeight + coneHeight;
                    break;
                case "cone_bottom":
                    tankHeight = coneHeight + cylinderHeight;
                    break;
                case "inv_piram":
                    tankHeight = height + height2;
                    break;
                case "horiz_caps":
                    tankHeight = 2 * radius;
                    break;
                case "vert_caps":
                    tankHeight = length + 2 * radius; // TODO KLOPT DIT ?????
                    break;
                case "horiz_oval":
                case "vert_oval":
                    tankHeight = height;
                    break;
                case "frustrum":
                    tankHeight = height;
                    break;
                case "sphere":
                    tankHeight = 2 * radius;
                    break;
                case "horiz_ellip":
                    tankHeight = 2 * radius;
                    break;
                case "custom_table":
                    tankHeight = customTable[customTable.length-1].height;
                    break;
                default:
                    throw "Unsupported tank type";
            }
            
            if (measuredHeight > tankHeight) { 
                node.warn("The measured depth (" + measuredHeight + ") is larger than the tank height (" + tankHeight + ")");
                return;
            }
            
            if (bottomLimit > tankHeight) { 
                node.warn("The bottom limit (" + bottomLimit + ") is larger than the tank height (" + tankHeight + ")");
                return;
            }
            
            if (topLimit > tankHeight) { 
                node.warn("The top limit (" + topLimit + ") is larger than the tank height (" + tankHeight + ")");
                return;
            }
            
            if ((bottomLimit + topLimit) >= tankHeight) { 
                node.warn("The sum of bottom and top limit (" + (bottomLimit + topLimit) + ") is larger than the tank height (" + tankHeight + ")");
                return;
            }

            // Determine the fluid height
            switch (node.measurement) {
                case "above":
                    // The msg.payload contains the height of the air (above the fluid)
                    fluidHeight = tankHeight - measuredHeight;
                    break;
                case "fluid":    
                    // The msg.payload already contains the height of the fluid
                    fluidHeight = measuredHeight;
                    break;
            }

            try {
                // Calculate the total tank volume and the (partially) filled volume, depending on the tank type
                switch(tankType) {
                    case "horiz_cylin":
                        totalVolume = getTotalVolumeHorizonalCylinder(radius, length);
                        filledVolume = getPartialVolumeHorizonalCylinder(radius, length, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeHorizonalCylinder(radius, length, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeHorizonalCylinder(radius, length, tankHeight - topLimit);
                        break;
                    case "vert_cylin":
                        totalVolume = getTotalVolumeVerticalCylinder(radius, height);
                        filledVolume = getPartialVolumeVerticalCylinder(radius, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeVerticalCylinder(radius, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeVerticalCylinder(radius, tankHeight - topLimit);
                        break;
                    case "rect_prism":
                        totalVolume = getTotalVolumeRectangularPrism(width, length, height);
                        filledVolume = getPartialVolumeRectangularPrism(width, length, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeRectangularPrism(width, length, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeRectangularPrism(width, length, tankHeight - topLimit);
                        break;
                    case "cone_top":
                        totalVolume = getTotalVolumeConeTop(coneHeight, cylinderHeight, radiusTop, radiusBottom);
                        filledVolume = getPartialVolumeConeTop(coneHeight, cylinderHeight, radiusTop, radiusBottom, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeConeTop(coneHeight, cylinderHeight, radiusTop, radiusBottom, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeConeTop(coneHeight, cylinderHeight, radiusTop, radiusBottom, tankHeight - topLimit);
                        break;
                    case "cone_bottom":
                        totalVolume = getTotalVolumeConeBottom(coneHeight, cylinderHeight, radiusTop, radiusBottom);
                        filledVolume = getPartialVolumeConeBottom(coneHeight, cylinderHeight, radiusTop, radiusBottom, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeConeBottom(coneHeight, cylinderHeight, radiusTop, radiusBottom, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeConeBottom(coneHeight, cylinderHeight, radiusTop, radiusBottom, tankHeight - topLimit);
                        break;
                    case "inv_piram":
                        totalVolume = getTotalVolumeInversePiramid(width, length, height, width2, length2, height2);
                        filledVolume = getPartialVolumeInversePiramid(width, length, height, width2, length2, height2, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeInversePiramid(width, length, height, width2, length2, height2, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeInversePiramid(width, length, height, width2, length2, height2, tankHeight - topLimit);
                        break;                    
                    case "horiz_caps":
                        totalVolume = getTotalVolumeHorizontalCapsule(radius, length);
                        filledVolume = getPartialVolumeHorizontalCapsule(radius, length, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeHorizontalCapsule(radius, length, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeHorizontalCapsule(radius, length, tankHeight - topLimit);
                        break;
                    case "vert_caps":
                        totalVolume = getTotalVolumeVerticalCapsule(radius, length);
                        filledVolume = getPartialVolumeVerticalCapsule(radius, length, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeVerticalCapsule(radius, length, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeVerticalCapsule(radius, length, tankHeight - topLimit);
                        break;
                    case "horiz_oval":
                    case "vert_oval":
                        totalVolume = getTotalVolumeOval(width, length, height);
                        filledVolume = getPartialVolumeOval(width, length, height, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeOval(width, length, height, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeOval(width, length, height, tankHeight - topLimit);
                        break;
                    case "frustrum":
                        totalVolume = getTotalVolumeFrustrum(height, radiusTop, radiusBottom);
                        filledVolume = getPartialVolumeFrustrum(height, radiusTop, radiusBottom, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeFrustrum(height, radiusTop, radiusBottom, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeFrustrum(height, radiusTop, radiusBottom, tankHeight - topLimit);
                        break;
                    case "sphere":
                        totalVolume = getTotalVolumeSphere(radius);
                        filledVolume = getPartialVolumeSphere(radius, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeSphere(radius, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeSphere(radius, tankHeight - topLimit);
                        break;
                    case "horiz_ellip":    
                        totalVolume = getTotalVolumeHorizontalElliptical(radius, length);
                        filledVolume = getPartialVolumeHorizontalElliptical(radius, length, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeHorizontalElliptical(radius, length, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeHorizontalElliptical(radius, length, tankHeight - topLimit);
                        break;
                    case "custom_table":    
                        totalVolume = getTotalVolumeCustomTable(customTable);
                        filledVolume = getPartialVolumeCustomTable(customTable, fluidHeight);
                        minimumVolume = (bottomLimit == 0) ? 0 : getPartialVolumeCustomTable(customTable, bottomLimit);
                        maximumVolume = (topLimit == 0) ? totalVolume : getPartialVolumeCustomTable(customTable, tankHeight - topLimit);
                        break;
                    default:
                        throw "Unsupported tank type";
                }
            } 
            catch(err) {
                node.error("Cannot calculate volume: " + err);
                return;
            }
            
            // Calculate the empty volume above the fluid
            var emptyVolume = (totalVolume - filledVolume);
            
            // Calculate the usable volume, between the minimum and maximum tank limits
            var usableVolume = maximumVolume - minimumVolume;
            
            // Calculate the usable filled volume, which needs to be between minimumVolume and maximumVolume
            var usableFilledVolume = Math.max(0, Math.min(maximumVolume, filledVolume) - minimumVolume);
            
            // Calculate the usable empty volume, which is the remaining part in the usableVolume
            var usableEmptyVolume = usableVolume - usableFilledVolume;
            
            // Calculate how many percentage of the tank is filled
            var fillPercentage = 100 * filledVolume / totalVolume;
            
            // Calculate how many percentage of the tank is empty
            var emptyPercentage = 100 - fillPercentage;
            
            // Calculate how many percentage of the usable tank is filled
            var usableFillPercentage = 100 * usableFilledVolume / usableVolume;
            
            // Calculate how many percentage of the usable tank is empty
            var usableEmptyPercentage = 100 - usableFillPercentage;
            
            // Since all input values have been converted to cm, the calulated volumes will be cm3.
            // If another volume unit is required, then convert the volumes to the specified format.
            if (node.outputUnit !== "cm3") {
                totalVolume        = convert(totalVolume).from("cm3").to(node.outputUnit);
                filledVolume       = convert(filledVolume).from("cm3").to(node.outputUnit);
                emptyVolume        = convert(emptyVolume).from("cm3").to(node.outputUnit);
                usableVolume       = convert(usableVolume).from("cm3").to(node.outputUnit);
                usableFilledVolume = convert(usableFilledVolume).from("cm3").to(node.outputUnit);
                usableEmptyVolume  = convert(usableEmptyVolume).from("cm3").to(node.outputUnit);
            }   

            // Make sure all output numbers are rounded (i.e. no decimals)
            totalVolume           = Math.round(totalVolume);
            filledVolume          = Math.round(filledVolume);
            emptyVolume           = Math.round(emptyVolume);
            usableVolume          = Math.round(usableVolume);
            usableFilledVolume    = Math.round(usableFilledVolume);
            usableEmptyVolume     = Math.round(usableEmptyVolume);
            fillPercentage        = Math.round(fillPercentage);
            emptyPercentage       = Math.round(emptyPercentage);
            usableFillPercentage  = Math.round(usableFillPercentage);
            usableEmptyPercentage = Math.round(usableEmptyPercentage);
            
            try {
                var result = {
                    totalVolume: totalVolume,
                    filledVolume: filledVolume,
                    emptyVolume: emptyVolume,
                    usableVolume: usableVolume,
                    usableFilledVolume: usableFilledVolume,
                    usableEmptyVolume: usableEmptyVolume,
                    fillPercentage: fillPercentage,
                    emptyPercentage: emptyPercentage,
                    usableFillPercentage: usableFillPercentage,
                    usableEmptyPercentage: usableEmptyPercentage
                };
                RED.util.setMessageProperty(msg, node.outputField, result);
            } 
            catch(err) {
                node.error("The output msg." + node.outputField + " field can not be set");
                return;
            }
            
            node.send(msg);
        });
    }

    RED.nodes.registerType("tank-volume",TankVolumeNode);
    
    // Make all the available tank images accessible for the node's config screen.
    // Don't check permissions (see https://discourse.nodered.org/t/not-sure-how-to-deal-with-httpadminroot/53473)
    RED.httpAdmin.get('/tank-volume/:image', function(req, res){
        const fullPath = path.join(__dirname, "tank_images", req.params.image);
        res.sendFile(fullPath);
    });
}
