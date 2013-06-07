/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

define(["cocos2d/CCNamespace", "extensions/CCBReader/CCBAnimationManager", "extensions/CCBReader/CCBKeyframe", "extensions/CCBReader/CCBSequence",
    "cocos2d/actions/CCActionInstant", "cocos2d/platform/CCClass", "extensions/CCBReader/CCBValue", "cocos2d/platform/CCFileUtils", "cocos2d/base_nodes/CCNode",
    "extensions/CCBReader/CCNodeLoaderLibrary", "cocos2d/cocoa/CCGeometry", "cocos2d/layers_scenes_transitions_nodes/CCScene", "cocos2d/sprite_nodes/CCSpriteFrame",
    "cocos2d/sprite_nodes/CCSpriteFrameCache", "cocos2d/platform/CCTypes", "cocos2d/platform/CCCommon"], function (cc) {
    cc.BUILDER_VERSION = 5;

    cc.BUILDER_PROPTYPE_POSITION = 0;
    cc.BUILDER_PROPTYPE_SIZE = 1;
    cc.BUILDER_PROPTYPE_POINT = 2;
    cc.BUILDER_PROPTYPE_POINTLOCK = 3;
    cc.BUILDER_PROPTYPE_SCALELOCK = 4;
    cc.BUILDER_PROPTYPE_DEGREES = 5;
    cc.BUILDER_PROPTYPE_INTEGER = 6;
    cc.BUILDER_PROPTYPE_FLOAT = 7;
    cc.BUILDER_PROPTYPE_FLOATVAR = 8;
    cc.BUILDER_PROPTYPE_CHECK = 9;
    cc.BUILDER_PROPTYPE_SPRITEFRAME = 10;
    cc.BUILDER_PROPTYPE_TEXTURE = 11;
    cc.BUILDER_PROPTYPE_BYTE = 12;
    cc.BUILDER_PROPTYPE_COLOR3 = 13;
    cc.BUILDER_PROPTYPE_COLOR4VAR = 14;
    cc.BUILDER_PROPTYPE_FLIP = 15;
    cc.BUILDER_PROPTYPE_BLENDMODE = 16;
    cc.BUILDER_PROPTYPE_FNTFILE = 17;
    cc.BUILDER_PROPTYPE_TEXT = 18;
    cc.BUILDER_PROPTYPE_FONTTTF = 19;
    cc.BUILDER_PROPTYPE_INTEGERLABELED = 20;
    cc.BUILDER_PROPTYPE_BLOCK = 21;
    cc.BUILDER_PROPTYPE_ANIMATION = 22;
    cc.BUILDER_PROPTYPE_CCBFILE = 23;
    cc.BUILDER_PROPTYPE_STRING = 24;
    cc.BUILDER_PROPTYPE_BLOCKCCCONTROL = 25;
    cc.BUILDER_PROPTYPE_FLOATSCALE = 26;
    cc.BUILDER_PROPTYPE_FLOATXY = 27;

    cc.BUILDER_FLOAT0 = 0;
    cc.BUILDER_FLOAT1 = 1;
    cc.BUILDER_FLOAT_MINUS1 = 2;
    cc.BUILDER_FLOAT05 = 3;
    cc.BUILDER_FLOAT_INTEGER = 4;
    cc.BUILDER_FLOAT_FULL = 5;

    cc.BUILDER_PLATFORM_ALL = 0;
    cc.BUILDER_PLATFORM_IOS = 1;
    cc.BUILDER_PLATFORM_MAC = 2;

    cc.BUILDER_TARGETTYPE_NONE = 0;
    cc.BUILDER_TARGETTYPE_DOCUMENTROOT = 1;
    cc.BUILDER_TARGETTYPE_OWNER = 2;

    cc.BUILDER_KEYFRAME_EASING_INSTANT = 0;
    cc.BUILDER_KEYFRAME_EASING_LINEAR = 1;
    cc.BUILDER_KEYFRAME_EASING_CUBIC_IN = 2;
    cc.BUILDER_KEYFRAME_EASING_CUBIC_OUT = 3;
    cc.BUILDER_KEYFRAME_EASING_CUBIC_INOUT = 4;
    cc.BUILDER_KEYFRAME_EASING_ELASTIC_IN = 5;
    cc.BUILDER_KEYFRAME_EASING_ELASTIC_OUT = 6;
    cc.BUILDER_KEYFRAME_EASING_ELASTIC_INOUT = 7;
    cc.BUILDER_KEYFRAME_EASING_BOUNCE_IN = 8;
    cc.BUILDER_KEYFRAME_EASING_BOUNCE_OUT = 9;
    cc.BUILDER_KEYFRAME_EASING_BOUNCE_INOUT = 10;
    cc.BUILDER_KEYFRAME_EASING_BACK_IN = 11;
    cc.BUILDER_KEYFRAME_EASING_BACK_OUT = 12;
    cc.BUILDER_KEYFRAME_EASING_BACK_INOUT = 13;

    cc.BUILDER_POSITIONTYPE_RELATIVE_BOTTOM_LEFT = 0;
    cc.BUILDER_POSITIONTYPE_RELATIVE_TOP_LEFT = 1;
    cc.BUILDER_POSITIONTYPE_RELATIVE_TOP_RIGHT = 2;
    cc.BUILDER_POSITIONTYPE_RELATIVE_BOTTOM_RIGHT = 3;
    cc.BUILDER_POSITIONTYPE_PERCENT = 4;
    cc.BUILDER_POSITIONTYPE_MULTIPLY_RESOLUTION = 5;

    cc.BUILDER_SIZETYPE_ABSOLUTE = 0;
    cc.BUILDER_SIZETYPE_PERCENT = 1;
    cc.BUILDER_SIZETYPE_RELATIVE_CONTAINER = 2;
    cc.BUILDER_SIZETYPE_HORIZONTAL_PERCENT = 3;
    cc.BUILDER_SIZETYPE_VERTICAL_PERCENT = 4;
    cc.BUILDER_SIZETYPE_MULTIPLY_RESOLUTION = 5;

    cc.BUILDER_SCALETYPE_ABSOLUTE = 0;
    cc.BUILDER_SCALETYPE_MULTIPLY_RESOLUTION = 1;

    var _ccbGlobalContext = _ccbGlobalContext || window;

    cc.BuilderFile = cc.Node.extend({
        _ccbFileNode: null,

        getCCBFileNode: function () {
            return this._ccbFileNode;
        },
        setCCBFileNode: function (node) {
            this._ccbFileNode = node;
        }
    });

    cc.BuilderFile.create = function () {
        return new cc.BuilderFile();
    };

    /**
     * Parse CCBI file which is generated by CocosBuilder
     */
    cc.BuilderReader = cc.Class.extend({
        _jsControlled: false,
        _data: null,
        _ccbRootPath: "",

        _bytes: 0,
        _currentByte: 0,
        _currentBit: 0,

        _stringCache: null,
        _loadedSpriteSheets: null,

        _owner: null,
        _actionManager: null,
        _animationManagers: null,
        _animatedProps: null,

        _ccNodeLoaderLibrary: null,
        _ccNodeLoaderListener: null,
        _ccbMemberVariableAssigner: null,
        _ccbSelectorResolver: null,

        _ownerOutletNames: null,
        _ownerOutletNodes: null,
        _nodesWithAnimationManagers: null,
        _animationManagerForNodes: null,

        _ownerCallbackNames: null,
        _ownerCallbackNodes: null,

        _hasScriptingOwner: false,

        ctor: function (ccNodeLoaderLibrary, ccbMemberVariableAssigner, ccbSelectorResolver, ccNodeLoaderListener) {
            this._stringCache = [];
            this._loadedSpriteSheets = [];
            this._currentBit = -1;
            this._currentByte = -1;

            if (arguments.length != 0) {
                if (ccNodeLoaderLibrary instanceof cc.BuilderReader) {
                    var ccbReader = ccNodeLoaderLibrary;

                    /* Borrow data from the 'parent' CCBReader. */
                    this._loadedSpriteSheets = ccbReader._loadedSpriteSheets;
                    this._ccNodeLoaderLibrary = ccbReader._ccNodeLoaderLibrary;

                    this._ccbMemberVariableAssigner = ccbReader._ccbMemberVariableAssigner;
                    this._ccbSelectorResolver = ccbReader._ccbSelectorResolver;
                    this._ccNodeLoaderListener = ccbReader._ccNodeLoaderListener;

                    this._ownerCallbackNames = ccbReader._ownerCallbackNames;
                    this._ownerCallbackNodes = ccbReader._ownerCallbackNodes;
                    this._ownerOutletNames = ccbReader._ownerOutletNames;
                    this._ownerOutletNodes = ccbReader._ownerOutletNodes;
                    this._ccbRootPath = ccbReader._ccbRootPath;
                } else {
                    this._ccNodeLoaderLibrary = ccNodeLoaderLibrary;
                    this._ccbMemberVariableAssigner = ccbMemberVariableAssigner;
                    this._ccbSelectorResolver = ccbSelectorResolver;
                    this._ccNodeLoaderListener = ccNodeLoaderListener;
                }
            }
        },

        getCCBRootPath: function () {
            return this._ccbRootPath;
        },

        setCCBRootPath: function (rootPath) {
            this._ccbRootPath = rootPath;
        },

        initWithData: function (data, owner) {
            //setup action manager
            this._actionManager = new cc.BuilderAnimationManager();

            //setup byte array
            //Array replace to CCData in Javascript
            this._data = data;
            this._bytes = data.length;
            this._currentBit = 0;
            this._currentByte = 0;

            this._owner = owner;

            //setup resolution scale and container size
            this._actionManager.setRootContainerSize(cc.Director.getInstance().getWinSize());

            return true;
        },

        readNodeGraphFromFile: function (ccbFileName, owner, parentSize, animationManager) {
            if (parentSize == null) {
                parentSize = cc.Director.getInstance().getWinSize();
            } else if (parentSize instanceof  cc.BuilderAnimationManager) {
                animationManager = parentSize;
                parentSize = cc.Director.getInstance().getWinSize();
            }

            var path = cc.FileUtils.getInstance().fullPathFromRelativePath(ccbFileName);
            var data = cc.FileUtils.getInstance().getByteArrayFromFile(path);

            return this.readNodeGraphFromData(data, owner, parentSize, animationManager);
        },

        readNodeGraphFromData: function (data, owner, parentSize, animationManager) {
            this.initWithData(data, owner);
            this._actionManager.setRootContainerSize(parentSize);
            this._actionManager.setOwner(owner);

            this._ownerOutletNames = [];
            this._ownerOutletNodes = [];
            this._ownerCallbackNames = [];
            this._ownerCallbackNodes = [];
            this._animationManagers = new cc._Dictionary();

            var nodeGraph = this.readFileWithCleanUp(true);

            if (nodeGraph && this._actionManager.getAutoPlaySequenceId() != -1) {
                //auto play animations
                this._actionManager.runAnimations(this._actionManager.getAutoPlaySequenceId(), 0);
            }

            if (this._jsControlled) {
                this._nodesWithAnimationManagers = [];
                this._animationManagerForNodes = [];

                var getAllKeys = this._animationManagers.allKeys();
                for (var i = 0; i < getAllKeys.length; i++) {
                    this._nodesWithAnimationManagers.push(getAllKeys[i]);
                    this._animationManagerForNodes.push(this._animationManagers.objectForKey(getAllKeys[i]));
                }
            }

            // Return action manager by reference
            //if (ppAnimationManager)
            //{
            //    *ppAnimationManager = mActionManager;
            //}

            return nodeGraph;
        },

        createSceneWithNodeGraphFromFile: function (ccbFileName, owner, parentSize, animationManager) {
            var node = this.readNodeGraphFromFile(ccbFileName, owner, parentSize, animationManager);
            var scene = cc.Scene.create();
            scene.addChild(node);
            return scene;
        },

        getCCBMemberVariableAssigner: function () {
            return this._ccbMemberVariableAssigner;
        },

        getCCBSelectorResolver: function () {
            return this._ccbSelectorResolver;
        },

        getAnimationManager: function () {
            return this._actionManager;
        },

        setAnimationManager: function (animationManager) {
            this._actionManager = animationManager;
        },

        getAnimatedProperties: function () {
            return this._animatedProps;
        },

        getLoadedSpriteSheet: function () {
            return this._loadedSpriteSheets;
        },

        getOwner: function () {
            return this._owner;
        },

        readInt: function (signed) {
            var numBits = 0;
            while (!this._getBit()) {
                numBits++;
            }

            var current = 0;
            for (var a = numBits - 1; a >= 0; a--) {
                if (this._getBit()) {
                    current |= 1 << a;
                }
            }
            current |= 1 << numBits;

            var num;
            if (signed) {
                var s = current % 2;
                if (s) {
                    num = 0 | (current / 2);
                } else {
                    num = 0 | (-current / 2);
                }
            } else {
                num = current - 1;
            }

            this._alignBits();

            return num;
        },

        readByte: function () {
            var byteValue = this._data[this._currentByte];
            this._currentByte++;
            return byteValue;
        },

        readBool: function () {
            return (0 != this.readByte());
        },

        readFloat: function () {
            var type = this.readByte();

            switch (type) {
                case cc.BUILDER_FLOAT0:
                    return 0;
                case cc.BUILDER_FLOAT1:
                    return 1;
                case cc.BUILDER_FLOAT_MINUS1:
                    return -1;
                case cc.BUILDER_FLOAT05:
                    return 0.5;
                case cc.BUILDER_FLOAT_INTEGER:
                    return this.readInt(true);
                default:
                    /* using a memcpy since the compiler isn't
                     * doing the float ptr math correctly on device.
                     */
                    var pF = this._decodeFloat(23, 8); //this._bytes + this._currentByte;
                    //this._currentByte += 4;
                    return pF;
            }
        },

        _decodeFloat: function (precisionBits, exponentBits) {
            var length = precisionBits + exponentBits + 1;
            var size = length >> 3;
            this._checkSize(length);

            var bias = Math.pow(2, exponentBits - 1) - 1;
            var signal = this._readBitsOnly(precisionBits + exponentBits, 1, size);
            var exponent = this._readBitsOnly(precisionBits, exponentBits, size);
            var significand = 0;
            var divisor = 2;
            var curByte = 0; //length + (-precisionBits >> 3) - 1;
            do {
                var byteValue = this._readByteOnly(++curByte, size);
                var startBit = precisionBits % 8 || 8;
                var mask = 1 << startBit;
                while (mask >>= 1) {
                    if (byteValue & mask) {
                        significand += 1 / divisor;
                    }
                    divisor *= 2;
                }
            } while (precisionBits -= startBit);

            this._currentByte += size;

            return exponent == (bias << 1) + 1 ? significand ? NaN : signal ? -Infinity : +Infinity
                : (1 + signal * -2) * (exponent || significand ? !exponent ? Math.pow(2, -bias + 1) * significand
                : Math.pow(2, exponent - bias) * (1 + significand) : 0);
        },

        _readBitsOnly: function (start, length, size) {
            var offsetLeft = (start + length) % 8;
            var offsetRight = start % 8;
            var curByte = size - (start >> 3) - 1;
            var lastByte = size + (-(start + length) >> 3);
            var diff = curByte - lastByte;

            var sum = (this._readByteOnly(curByte, size) >> offsetRight) & ((1 << (diff ? 8 - offsetRight : length)) - 1);

            if (diff && offsetLeft) {
                sum += (this._readByteOnly(lastByte++, size) & ((1 << offsetLeft) - 1)) << (diff-- << 3) - offsetRight;
            }

            while (diff) {
                sum += this._shl(this._readByteOnly(lastByte++, size), (diff-- << 3) - offsetRight);
            }

            return sum;
        },

        _readByteOnly: function (i, size) {
            return this._data[this._currentByte + size - i - 1];
        },

        _shl: function (a, b) {
            for (++b; --b; a = ((a %= 0x7fffffff + 1) & 0x40000000) == 0x40000000 ? a * 2 : (a - 0x40000000) * 2 + 0x7fffffff + 1);
            return a;
        },

        _checkSize: function (neededBits) {
            if (!(this._currentByte + Math.ceil(neededBits / 8) < this._data.length)) {
                throw new Error("Index out of bound");
            }
        },

        readCachedString: function () {
            return this._stringCache[this.readInt(false)];
        },

        isJSControlled: function () {
            return this._jsControlled;
        },

        getOwnerCallbackNames: function () {
            return this._ownerCallbackNames;
        },

        getOwnerCallbackNodes: function () {
            return this._ownerCallbackNodes;
        },

        getOwnerOutletNames: function () {
            return this._ownerOutletNames;
        },

        getOwnerOutletNodes: function () {
            return this._ownerOutletNodes;
        },

        getNodesWithAnimationManagers: function () {
            return this._nodesWithAnimationManagers;
        },

        getAnimationManagersForNodes: function () {
            return this._animationManagerForNodes;
        },

        getAnimationManagers: function () {
            return this._animationManagers;
        },

        setAnimationManagers: function (animationManagers) {
            this._animationManagers = animationManagers;
        },

        addOwnerCallbackName: function (name) {
            this._ownerCallbackNames.push(name)
        },

        addOwnerCallbackNode: function (node) {
            this._ownerCallbackNodes.push(node);
        },

        addDocumentCallbackName: function (name) {
            this._actionManager.addDocumentCallbackName(name);
        },

        addDocumentCallbackNode: function (node) {
            this._actionManager.addDocumentCallbackNode(node);
        },

        readFileWithCleanUp: function (cleanUp) {
            if (!this._readHeader())
                return null;
            if (!this._readStringCache())
                return null;
            if (!this._readSequences())
                return null;

            var node = this._readNodeGraph();
            this._animationManagers.setObject(this._actionManager, node);

            if (cleanUp)
                this._cleanUpNodeGraph(node);
            return node;
        },

        _cleanUpNodeGraph: function (node) {
            node.setUserObject(null);
            var getChildren = node.getChildren();
            for (var i = 0; i < getChildren.length; i++) {
                this._cleanUpNodeGraph(getChildren[i]);
            }
        },

        _readCallbackKeyframesForSeq: function (seq) {
            var numKeyframes = this.readInt(false);

            if (!numKeyframes)
                return true;

            var channel = new cc.BuilderSequenceProperty();

            for (var i = 0; i < numKeyframes; i++) {
                var time = this.readFloat();
                var callbackName = this.readCachedString();
                var callbackType = this.readInt(false);

                var value = [ callbackName, callbackType];

                var keyframe = new cc.BuilderKeyframe();
                keyframe.setTime(time);
                keyframe.setValue(value);

                if (this._jsControlled) {
                    this._actionManager.getKeyframeCallbacks().push(callbackType + ":" + callbackName);
                }
                channel.getKeyframes().push(keyframe);
            }

            // Assign to sequence
            seq.setCallbackChannel(channel);

            return true;
        },

        _readSoundKeyframesForSeq: function (seq) {
            var numKeyframes = this.readInt(false);

            if (!numKeyframes) return true;

            var channel = new cc.BuilderSequenceProperty();

            for (var i = 0; i < numKeyframes; i++) {
                var time = this.readFloat();
                var soundFile = this.readCachedString();
                var pitch = this.readFloat();
                var pan = this.readFloat();
                var gain = this.readFloat();

                var value = [soundFile, pitch, pan, gain];
                var keyframe = new cc.BuilderKeyframe();
                keyframe.setTime(time);
                keyframe.setValue(value);

                channel.getKeyframes().push(keyframe);
            }

            // Assign to sequence
            seq.setSoundChannel(channel);

            return true;
        },
        _readSequences: function () {
            var sequences = this._actionManager.getSequences();
            var numSeqs = this.readInt(false);
            for (var i = 0; i < numSeqs; i++) {
                var seq = new cc.BuilderSequence();
                seq.setDuration(this.readFloat());
                seq.setName(this.readCachedString());
                seq.setSequenceId(this.readInt(false));
                seq.setChainedSequenceId(this.readInt(true));

                if (!this._readCallbackKeyframesForSeq(seq))
                    return false;
                if (!this._readSoundKeyframesForSeq(seq))
                    return false;

                sequences.push(seq);
            }
            this._actionManager.setAutoPlaySequenceId(this.readInt(true));
            return true;
        },

        readKeyframe: function (type) {
            var keyframe = new cc.BuilderKeyframe();
            keyframe.setTime(this.readFloat());
            var easingType = this.readInt(false);
            var easingOpt = 0;
            var value = null;

            if (easingType === cc.BUILDER_KEYFRAME_EASING_CUBIC_IN
                || easingType === cc.BUILDER_KEYFRAME_EASING_CUBIC_OUT
                || easingType === cc.BUILDER_KEYFRAME_EASING_CUBIC_INOUT
                || easingType === cc.BUILDER_KEYFRAME_EASING_ELASTIC_IN
                || easingType === cc.BUILDER_KEYFRAME_EASING_ELASTIC_OUT
                || easingType === cc.BUILDER_KEYFRAME_EASING_ELASTIC_INOUT) {
                easingOpt = this.readFloat();
            }

            keyframe.setEasingType(easingType);
            keyframe.setEasingOpt(easingOpt);

            if (type == cc.BUILDER_PROPTYPE_CHECK) {
                value = this.readBool();
            } else if (type == cc.BUILDER_PROPTYPE_BYTE) {
                value = this.readByte();
            } else if (type == cc.BUILDER_PROPTYPE_COLOR3) {
                var c = cc.c3(this.readByte(), this.readByte(), this.readByte());
                value = cc.Color3BWapper.create(c);
            } else if (type == cc.BUILDER_PROPTYPE_DEGREES) {
                value = this.readFloat();
            } else if (type == cc.BUILDER_PROPTYPE_SCALELOCK || type == cc.BUILDER_PROPTYPE_POSITION || type == cc.BUILDER_PROPTYPE_FLOATXY) {
                value = [this.readFloat(), this.readFloat()];
            } else if (type == cc.BUILDER_PROPTYPE_SPRITEFRAME) {
                var spriteSheet = this.readCachedString();
                var spriteFile = this.readCachedString();

                if (spriteSheet == "") {
                    spriteFile = this._ccbRootPath + spriteFile;
                    var texture = cc.TextureCache.getInstance().addImage(spriteFile);
                    var bounds;
                    if (cc.renderContextType == cc.CANVAS)
                        bounds = cc.RectMake(0, 0, texture.width, texture.height);
                    else
                        bounds = cc.RectMake(0, 0, texture.getContentSize().width, texture.getContentSize().height);
                    value = cc.SpriteFrame.createWithTexture(texture, bounds);
                } else {
                    spriteSheet = this._ccbRootPath + spriteSheet;
                    var frameCache = cc.SpriteFrameCache.getInstance();
                    // Load the sprite sheet only if it is not loaded
                    if (this._loadedSpriteSheets.indexOf(spriteSheet) == -1) {
                        frameCache.addSpriteFrames(spriteSheet);
                        this._loadedSpriteSheets.push(spriteSheet);
                    }
                    value = frameCache.getSpriteFrame(spriteFile);
                }
            }
            keyframe.setValue(value);
            return keyframe;
        },

        _readHeader: function () {
            /* If no bytes loaded, don't crash about it. */
            if (this._data == null) {
                return false;
            }

            /* Read magic bytes */
            var magicBytes = this._readStringFromBytes(this._currentByte, 4, true);
            this._currentByte += 4;

            if (magicBytes != 'ccbi') {
                return false;
            }

            /* Read version. */
            var version = this.readInt(false);
            if (version != cc.BUILDER_VERSION) {
                cc.log("WARNING! Incompatible ccbi file version (file: " + version + " reader: " + cc.BUILDER_VERSION + ")");
                return false;
            }

            this._jsControlled = this.readBool();
            this._actionManager._jsControlled = this._jsControlled;
            // no need to set if it is "jscontrolled". It is obvious.
            return true;
        },

        _readStringFromBytes: function (startIndex, strLen, reverse) {
            reverse = reverse || false;
            var strValue = "";
            var i;
            if (reverse) {
                for (i = strLen - 1; i >= 0; i--) {
                    strValue += String.fromCharCode(this._data[this._currentByte + i]);
                }
            } else {
                for (i = 0; i < strLen; i++) {
                    strValue += String.fromCharCode(this._data[this._currentByte + i]);
                }
            }
            return strValue;
        },

        _readStringCache: function () {
            var numStrings = this.readInt(false);
            for (var i = 0; i < numStrings; i++) {
                this._readStringCacheEntry();
            }
            return true;
        },

        _readStringCacheEntry: function () {
            var b0 = this.readByte();
            var b1 = this.readByte();

            var numBytes = b0 << 8 | b1;

            var str = "";
            for (var i = 0; i < numBytes; i++) {
                var hexChar = this._data[this._currentByte + i].toString("16").toUpperCase();
                hexChar = hexChar.length > 1 ? hexChar : "0" + hexChar;
                str += "%" + hexChar;
            }
            str = decodeURIComponent(str);

            this._currentByte += numBytes;
            this._stringCache.push(str);
        },

        _readNodeGraph: function (parent) {
            /* Read class name. */
            var className = this.readCachedString();

            var jsControlledName;
            if (this._jsControlled)
                jsControlledName = this.readCachedString();

            var memberVarAssignmentType = this.readInt(false);
            var memberVarAssignmentName;
            if (memberVarAssignmentType != cc.BUILDER_TARGETTYPE_NONE) {
                memberVarAssignmentName = this.readCachedString();
            }

            var ccNodeLoader = this._ccNodeLoaderLibrary.getCCNodeLoader(className);
            if (!ccNodeLoader) {
                ccNodeLoader = this._ccNodeLoaderLibrary.getCCNodeLoader("CCNode");
                //cc.log("no corresponding node loader for" + className);
                //return null;
            }
            var node = ccNodeLoader.loadCCNode(parent, this);

            //set root node
            if (!this._actionManager.getRootNode())
                this._actionManager.setRootNode(node);

            if (this._jsControlled && node == this._actionManager.getRootNode()) {
                this._actionManager.setDocumentControllerName(jsControlledName);
            }


            //read animated properties
            var seqs = new cc._Dictionary();
            this._animatedProps = [];

            var i;
            var numSequence = this.readInt(false);
            for (i = 0; i < numSequence; ++i) {
                var seqId = this.readInt(false);
                var seqNodeProps = new cc._Dictionary();

                var numProps = this.readInt(false);

                for (var j = 0; j < numProps; ++j) {
                    var seqProp = new cc.BuilderSequenceProperty();
                    seqProp.setName(this.readCachedString());
                    seqProp.setType(this.readInt(false));

                    this._animatedProps.push(seqProp.getName());
                    var numKeyframes = this.readInt(false);

                    for (var k = 0; k < numKeyframes; ++k) {
                        var keyFrame = this.readKeyframe(seqProp.getType());
                        seqProp.getKeyframes().push(keyFrame);
                    }
                    seqNodeProps.setObject(seqProp, seqProp.getName());
                }
                seqs.setObject(seqNodeProps, seqId);
            }

            if (seqs.count() > 0)
                this._actionManager.addNode(node, seqs);

            //read properties
            ccNodeLoader.parseProperties(node, parent, this);

            //handle sub ccb files(remove middle node)
            if (node instanceof cc.BuilderFile) {
                var embeddedNode = node.getCCBFileNode();
                embeddedNode.setPosition(node.getPosition());
                embeddedNode.setRotation(node.getRotation());
                embeddedNode.setScale(node.getScale());
                embeddedNode.setTag(node.getTag());
                embeddedNode.setVisible(true);
                embeddedNode.ignoreAnchorPointForPosition(node.isIgnoreAnchorPointForPosition());

                node.setCCBFileNode(null);
                node = embeddedNode;
            }

            if (memberVarAssignmentType != cc.BUILDER_TARGETTYPE_NONE) {
                if (!this._jsControlled) {
                    var target = null;
                    if (memberVarAssignmentType == cc.BUILDER_TARGETTYPE_DOCUMENTROOT) {
                        target = this._actionManager.getRootNode();
                    } else if (memberVarAssignmentType == cc.BUILDER_TARGETTYPE_OWNER) {
                        target = this._owner;
                    }

                    if (target != null) {
                        var assigned = false;

                        if (target != null && (target.onAssignCCBMemberVariable)) {
                            assigned = target.onAssignCCBMemberVariable(target, memberVarAssignmentName, node);
                        }

                        if (!assigned && this._ccbMemberVariableAssigner != null && this._ccbMemberVariableAssigner.onAssignCCBMemberVariable) {
                            this._ccbMemberVariableAssigner.onAssignCCBMemberVariable(target, memberVarAssignmentName, node);
                        }
                    }
                } else {
                    if (memberVarAssignmentType == cc.BUILDER_TARGETTYPE_DOCUMENTROOT) {
                        this._actionManager.addDocumentOutletName(memberVarAssignmentName);
                        this._actionManager.addDocumentOutletNode(node);
                    } else {
                        this._ownerOutletNames.push(memberVarAssignmentName);
                        this._ownerOutletNodes.push(node);
                    }
                }
            }

            // Assign custom properties.
            if (ccNodeLoader.getCustomProperties().length > 0) {
                var customAssigned = false;

                if (!this._jsControlled) {
                    var target = node;
                    if (target != null && target.onAssignCCBCustomProperty != null) {
                        var customProperties = ccNodeLoader.getCustomProperties();
                        var customPropKeys = customProperties.allKeys();
                        for (i = 0; i < customPropKeys.length; i++) {
                            var customPropValue = customProperties.objectForKey(customPropKeys[i]);
                            customAssigned = target.onAssignCCBCustomProperty(target, customPropKeys[i], customPropValue);

                            if (!customAssigned && (this._ccbMemberVariableAssigner != null) && (this._ccbMemberVariableAssigner.onAssignCCBCustomProperty != null))
                                customAssigned = this._ccbMemberVariableAssigner.onAssignCCBCustomProperty(target, customPropKeys[i], customPropValue);
                        }
                    }
                }
            }

            this._animatedProps = null;

            /* Read and add children. */
            var numChildren = this.readInt(false);
            for (i = 0; i < numChildren; i++) {
                var child = this._readNodeGraph(node);
                node.addChild(child);
            }

            // Call onNodeLoaded
            if (node != null && node.onNodeLoaded) {
                node.onNodeLoaded(node, ccNodeLoader);
            } else if (this._ccNodeLoaderListener != null) {
                this._ccNodeLoaderListener.onNodeLoaded(node, ccNodeLoader);
            }

            return node;
        },

        _getBit: function () {
            var bit = (this._data[this._currentByte] & (1 << this._currentBit)) != 0;

            this._currentBit++;

            if (this._currentBit >= 8) {
                this._currentBit = 0;
                this._currentByte++;
            }

            return bit;
        },

        _alignBits: function () {
            if (this._currentBit) {
                this._currentBit = 0;
                this._currentByte++;
            }
        },

        _readUTF8: function () {
        }
    });

    cc.BuilderReader._ccbResolutionScale = 1;
    cc.BuilderReader.setResolutionScale = function (scale) {
        cc.BuilderReader._ccbResolutionScale = scale;
    };

    cc.BuilderReader.getResolutionScale = function () {
        return cc.BuilderReader._ccbResolutionScale;
    };

    cc.BuilderReader.loadAsScene = function (ccbFilePath, owner, parentSize, ccbRootPath) {
        ccbRootPath = ccbRootPath || cc.BuilderReader.getResourcePath();

        var getNode = cc.BuilderReader.load(ccbFilePath, owner, parentSize, ccbRootPath);

        var scene = cc.Scene.create();
        scene.addChild(getNode);
        return scene;
    };

    cc.BuilderReader.load = function (ccbFilePath, owner, parentSize, ccbRootPath) {
        ccbRootPath = ccbRootPath || cc.BuilderReader.getResourcePath();
        var reader = new cc.BuilderReader(cc.NodeLoaderLibrary.newDefaultCCNodeLoaderLibrary());
        reader.setCCBRootPath(ccbRootPath);
        if (ccbFilePath.toLowerCase().lastIndexOf(".ccbi") != ccbFilePath.length - 5)
            ccbFilePath = ccbFilePath + ".ccbi";

        var node = reader.readNodeGraphFromFile(ccbFilePath, owner, parentSize);
        var i;
        var callbackName, callbackNode, outletName, outletNode;
        // Assign owner callbacks & member variables
        if (owner) {
            // Callbacks
            var ownerCallbackNames = reader.getOwnerCallbackNames();
            var ownerCallbackNodes = reader.getOwnerCallbackNodes();
            for (i = 0; i < ownerCallbackNames.length; i++) {
                callbackName = ownerCallbackNames[i];
                callbackNode = ownerCallbackNodes[i];
                callbackNode.setCallback(owner[callbackName], owner);
            }

            // Variables
            var ownerOutletNames = reader.getOwnerOutletNames();
            var ownerOutletNodes = reader.getOwnerOutletNodes();
            for (i = 0; i < ownerOutletNames.length; i++) {
                outletName = ownerOutletNames[i];
                outletNode = ownerOutletNodes[i];
                owner[outletName] = outletNode;
            }
        }

        var nodesWithAnimationManagers = reader.getNodesWithAnimationManagers();
        var animationManagersForNodes = reader.getAnimationManagersForNodes();
        if (!nodesWithAnimationManagers || !animationManagersForNodes)
            return node;
        // Attach animation managers to nodes and assign root node callbacks and member variables
        for (i = 0; i < nodesWithAnimationManagers.length; i++) {
            var innerNode = nodesWithAnimationManagers[i];
            var animationManager = animationManagersForNodes[i];

            var j;

            innerNode.animationManager = animationManager;

            var documentControllerName = animationManager.getDocumentControllerName();
            if (!documentControllerName) continue;

            // Create a document controller
            var controller = new _ccbGlobalContext[documentControllerName]();
            controller.controllerName = documentControllerName;

            innerNode.controller = controller;
            controller.rootNode = innerNode;

            // Callbacks
            var documentCallbackNames = animationManager.getDocumentCallbackNames();
            var documentCallbackNodes = animationManager.getDocumentCallbackNodes();
            for (j = 0; j < documentCallbackNames.length; j++) {
                callbackName = documentCallbackNames[j];
                callbackNode = documentCallbackNodes[j];

                callbackNode.setCallback(controller[callbackName], controller);
            }

            // Variables
            var documentOutletNames = animationManager.getDocumentOutletNames();
            var documentOutletNodes = animationManager.getDocumentOutletNodes();
            for (j = 0; j < documentOutletNames.length; j++) {
                outletName = documentOutletNames[j];
                outletNode = documentOutletNodes[j];

                controller[outletName] = outletNode;
            }

            if (controller.onDidLoadFromCCB && typeof(controller.onDidLoadFromCCB) == "function") {
                controller.onDidLoadFromCCB();
            }

            // Setup timeline callbacks
            var keyframeCallbacks = animationManager.getKeyframeCallbacks();
            for (j = 0; j < keyframeCallbacks.length; j++) {
                var callbackSplit = keyframeCallbacks[j].split(":");
                var callbackType = callbackSplit[0];
                var callbackName = callbackSplit[1];

                if (callbackType == 1) { // Document callback
                    var callfunc = cc.CallFunc.create(controller[callbackName], controller);
                    animationManager.setCallFunc(callfunc, keyframeCallbacks[j]);
                } else if (callbackType == 2 && owner) {// Owner callback
                    var callfunc = cc.CallFunc.create(owner[callbackName], owner);
                    animationManager.setCallFunc(callfunc, keyframeCallbacks[j]);
                }
            }
        }

        return node;
    };

    cc.BuilderReader._resourcePath = "";
    cc.BuilderReader.setResourcePath = function (rootPath) {
        cc.BuilderReader._resourcePath = rootPath;
    };

    cc.BuilderReader.getResourcePath = function () {
        return cc.BuilderReader._resourcePath;
    };

    cc.BuilderReader.lastPathComponent = function (pathStr) {
        var slashPos = pathStr.lastIndexOf("/");
        if (slashPos != -1) {
            return pathStr.substring(slashPos + 1, pathStr.length - slashPos);
        }
        return pathStr;
    };

    cc.BuilderReader.deletePathExtension = function (pathStr) {
        var dotPos = pathStr.lastIndexOf(".");
        if (dotPos != -1) {
            return pathStr.substring(0, dotPos);
        }
        return pathStr;
    };

    cc.BuilderReader.toLowerCase = function (sourceStr) {
        return sourceStr.toLowerCase();
    };

    cc.BuilderReader.endsWith = function (sourceStr, ending) {
        if (sourceStr.length >= ending.length)
            return (sourceStr.lastIndexOf(ending) == 0);
        else
            return false;
    };

    cc.BuilderReader.concat = function (stringA, stringB) {
        return stringA + stringB;
    };
});