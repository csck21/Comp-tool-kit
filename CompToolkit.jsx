// CompToolkit.jsx — Dark UI Edition
// Window > CompToolkit.jsx  |  or run via File > Scripts > Run Script File

(function CompToolkit(thisObj) {

    // ── Helpers ───────────────────────────────────────────────────────────────

    function getComp() {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("No active composition.");
            return null;
        }
        return comp;
    }

    var _labelIndex = 1;
    function nextLabel() { var l = _labelIndex; _labelIndex = (_labelIndex % 16) + 1; return l; }

    var solidColors = [
        [0.85,0.15,0.15],[0.15,0.55,0.85],[0.15,0.75,0.35],[0.90,0.65,0.10],
        [0.65,0.15,0.85],[0.95,0.45,0.10],[0.10,0.75,0.75],[0.90,0.30,0.60]
    ];
    var _colorIndex = 0;
    function nextColor() { var c = solidColors[_colorIndex % solidColors.length]; _colorIndex++; return c; }

    // ── Colors ────────────────────────────────────────────────────────────────
    var C = {
        bg:      [0.09, 0.08, 0.12],
        panel:   [0.13, 0.11, 0.18],
        btn:     [0.17, 0.15, 0.23],
        accent:  [0.48, 0.30, 1.00],
        accentL: [0.62, 0.45, 1.00],
        text:    [0.90, 0.87, 1.00],
        textDim: [0.55, 0.48, 0.72],
        white:   [1.00, 1.00, 1.00]
    };

    // Only Window and Panel support backgroundColor in ScriptUI
    function setBG(el, color) {
        try {
            el.graphics.backgroundColor = el.graphics.newBrush(
                el.graphics.BrushType.SOLID_COLOR, color || C.bg, 1
            );
        } catch(e) {}
    }

    function setFG(el, color) {
        try {
            el.graphics.foregroundColor = el.graphics.newPen(
                el.graphics.PenType.SOLID_COLOR, color || C.text, 1
            );
        } catch(e) {}
    }

    // ── Anchor Logic ──────────────────────────────────────────────────────────

    function setAnchorPoint(pos) {
        var comp = getComp(); if (!comp) return;
        var selected = comp.selectedLayers;
        if (!selected.length) { alert("Select at least one layer."); return; }
        app.beginUndoGroup("Set Anchor Point");
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            var lw = comp.width, lh = comp.height;
            try { if (layer.source && layer.source.width) { lw = layer.source.width; lh = layer.source.height; } } catch(e) {}
            var tf     = layer.property("ADBE Transform Group");
            var oldAP  = tf.property("ADBE Anchor Point").value;
            var oldPos = tf.property("ADBE Position").value;
            var ax, ay;
            if      (pos==="TL"){ax=0;    ay=0;}
            else if (pos==="TC"){ax=lw/2; ay=0;}
            else if (pos==="TR"){ax=lw;   ay=0;}
            else if (pos==="ML"){ax=0;    ay=lh/2;}
            else if (pos==="MC"){ax=lw/2; ay=lh/2;}
            else if (pos==="MR"){ax=lw;   ay=lh/2;}
            else if (pos==="BL"){ax=0;    ay=lh;}
            else if (pos==="BC"){ax=lw/2; ay=lh;}
            else if (pos==="BR"){ax=lw;   ay=lh;}
            tf.property("ADBE Anchor Point").setValue([ax, ay, 0]);
            tf.property("ADBE Position").setValue([oldPos[0]+(ax-oldAP[0]), oldPos[1]+(ay-oldAP[1]), oldPos[2]||0]);
        }
        app.endUndoGroup();
    }

    // ── Build UI ──────────────────────────────────────────────────────────────

    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Comp Toolkit", undefined, {resizeable: true});

        win.orientation   = "column";
        win.alignChildren = ["fill","top"];
        win.spacing       = 4;
        win.margins       = 6;
        setBG(win, C.bg);

        // ── Header ────────────────────────────────────────────────────────────
        var header = win.add("panel", undefined, "");
        header.orientation   = "row";
        header.alignChildren = ["center","center"];
        header.margins       = [10, 8, 10, 8];
        header.spacing       = 10;
        setBG(header, C.panel);

        var logoTxt = header.add("statictext", undefined, "[ \u00b7:\u00b7 ]");
        setFG(logoTxt, C.accentL);

        var wordGroup = header.add("group");
        wordGroup.orientation   = "column";
        wordGroup.alignChildren = ["left","center"];
        wordGroup.spacing       = 0;

        var wTop = wordGroup.add("statictext", undefined, "COMP");
        var wBot = wordGroup.add("statictext", undefined, "TOOLKIT");
        setFG(wTop, C.white);
        setFG(wBot, C.white);

        // ── Tab Bar ───────────────────────────────────────────────────────────
        var tabBar = win.add("panel", undefined, "");
        tabBar.orientation   = "row";
        tabBar.alignChildren = ["fill","center"];
        tabBar.spacing       = 2;
        tabBar.margins       = [4, 4, 4, 4];
        setBG(tabBar, C.panel);

        function makeTabBtn(label) {
            var btn = tabBar.add("button", undefined, label);
            btn.preferredSize.height = 26;
            setBG(btn, C.btn);
            setFG(btn, C.textDim);
            return btn;
        }

        var t0 = makeTabBtn("ANCHOR");
        var t1 = makeTabBtn("CREATE");
        var t2 = makeTabBtn("ACTIONS");

        // ── Content area ──────────────────────────────────────────────────────
        var stack = win.add("group");
        stack.orientation   = "stack";
        stack.alignChildren = ["fill","top"];

        function sectionLabel(parent, txt) {
            var p = parent.add("panel", undefined, "");
            p.orientation   = "row";
            p.alignChildren = ["left","center"];
            p.margins       = [4, 4, 4, 4];
            setBG(p, C.panel);
            var lbl = p.add("statictext", undefined, txt.toUpperCase());
            setFG(lbl, C.accentL);
            return p;
        }

        function addBtn(parent, label, isPrimary) {
            var btn = parent.add("button", undefined, label);
            btn.preferredSize.height = 26;
            setBG(btn, isPrimary ? C.accent : C.btn);
            setFG(btn, isPrimary ? C.white  : C.text);
            return btn;
        }

        function addInput(parent, labelTxt, placeholder) {
            var grp = parent.add("group");
            grp.orientation   = "row";
            grp.alignChildren = ["left","center"];
            grp.spacing       = 6;
            var lbl = grp.add("statictext", undefined, labelTxt);
            lbl.preferredSize.width = 44;
            setFG(lbl, C.textDim);
            var inp = grp.add("edittext", undefined, placeholder || "");
            inp.preferredSize.width = 140;
            setBG(inp, C.panel);
            setFG(inp, C.text);
            return { grp: grp, input: inp };
        }

        // ════════════════════════════════════════════════════
        // ANCHOR PANEL
        // ════════════════════════════════════════════════════
        var pA = stack.add("group");
        pA.orientation   = "column";
        pA.alignChildren = ["fill","top"];
        pA.spacing       = 6;

        sectionLabel(pA, "Anchor Point");

        var apDefs = [
            {pos:"TL",lbl:"↖"},{pos:"TC",lbl:"↑"},{pos:"TR",lbl:"↗"},
            {pos:"ML",lbl:"←"},{pos:"MC",lbl:"●"},{pos:"MR",lbl:"→"},
            {pos:"BL",lbl:"↙"},{pos:"BC",lbl:"↓"},{pos:"BR",lbl:"↘"}
        ];
        for (var r = 0; r < 3; r++) {
            var apRow = pA.add("group");
            apRow.orientation   = "row";
            apRow.alignChildren = ["fill","center"];
            apRow.spacing       = 4;
            for (var c = 0; c < 3; c++) {
                (function(def) {
                    var btn = apRow.add("button", undefined, def.lbl);
                    btn.preferredSize = [54, 36];
                    setBG(btn, C.btn);
                    setFG(btn, C.accentL);
                    btn.onClick = function() { setAnchorPoint(def.pos); };
                })(apDefs[r*3+c]);
            }
        }

        sectionLabel(pA, "Center Layer");
        var cRow = pA.add("group");
        cRow.orientation = "row"; cRow.spacing = 4;
        var bCB = addBtn(cRow, "Both",       true);
        var bCH = addBtn(cRow, "Horizontal", false);
        var bCV = addBtn(cRow, "Vertical",   false);

        bCB.onClick = function() {
            var comp=getComp(); if(!comp) return;
            var sel=comp.selectedLayers; if(!sel.length){alert("Select a layer.");return;}
            app.beginUndoGroup("Center Both");
            for(var i=0;i<sel.length;i++) sel[i].property("ADBE Transform Group").property("ADBE Position").setValue([comp.width/2,comp.height/2]);
            app.endUndoGroup();
        };
        bCH.onClick = function() {
            var comp=getComp(); if(!comp) return;
            var sel=comp.selectedLayers; if(!sel.length){alert("Select a layer.");return;}
            app.beginUndoGroup("Center H");
            for(var i=0;i<sel.length;i++){var p=sel[i].property("ADBE Transform Group").property("ADBE Position").value;sel[i].property("ADBE Transform Group").property("ADBE Position").setValue([comp.width/2,p[1]]);}
            app.endUndoGroup();
        };
        bCV.onClick = function() {
            var comp=getComp(); if(!comp) return;
            var sel=comp.selectedLayers; if(!sel.length){alert("Select a layer.");return;}
            app.beginUndoGroup("Center V");
            for(var i=0;i<sel.length;i++){var p=sel[i].property("ADBE Transform Group").property("ADBE Position").value;sel[i].property("ADBE Transform Group").property("ADBE Position").setValue([p[0],comp.height/2]);}
            app.endUndoGroup();
        };

        sectionLabel(pA, "Transform");
        var rRow = pA.add("group");
        rRow.orientation = "row"; rRow.spacing = 4;
        var bRT = addBtn(rRow, "Reset Transform", false);
        var bRA = addBtn(rRow, "Reset Anchor",    false);

        bRT.onClick = function() {
            var comp=getComp(); if(!comp) return;
            var sel=comp.selectedLayers; if(!sel.length){alert("Select a layer.");return;}
            app.beginUndoGroup("Reset Transform");
            for(var i=0;i<sel.length;i++){var tf=sel[i].property("ADBE Transform Group");tf.property("ADBE Position").setValue([comp.width/2,comp.height/2]);tf.property("ADBE Rotate Z").setValue(0);tf.property("ADBE Scale").setValue([100,100,100]);tf.property("ADBE Opacity").setValue(100);}
            app.endUndoGroup();
        };
        bRA.onClick = function() {
            var comp=getComp(); if(!comp) return;
            var sel=comp.selectedLayers; if(!sel.length){alert("Select a layer.");return;}
            app.beginUndoGroup("Reset Anchor");
            for(var i=0;i<sel.length;i++){var lw=comp.width,lh=comp.height;try{if(sel[i].source&&sel[i].source.width){lw=sel[i].source.width;lh=sel[i].source.height;}}catch(e){}sel[i].property("ADBE Transform Group").property("ADBE Anchor Point").setValue([lw/2,lh/2,0]);}
            app.endUndoGroup();
        };

        // ════════════════════════════════════════════════════
        // CREATE PANEL
        // ════════════════════════════════════════════════════
        var pC = stack.add("group");
        pC.orientation   = "column";
        pC.alignChildren = ["fill","top"];
        pC.spacing       = 6;
        pC.visible       = false;

        sectionLabel(pC, "Layer Types");
        var nullR  = addInput(pC, "Null",   "Null 1");
        var solidR = addInput(pC, "Solid",  "Solid 1");
        var adjR   = addInput(pC, "Adjust", "Adjustment 1");

        var ltRow = pC.add("group"); ltRow.orientation="row"; ltRow.spacing=4;
        var bNull  = addBtn(ltRow, "Add Null",       true);
        var bSolid = addBtn(ltRow, "Add Solid",      false);
        var bAdj   = addBtn(ltRow, "Add Adjustment", false);

        bNull.onClick = function() {
            var comp=getComp(); if(!comp) return;
            app.beginUndoGroup("Add Null");
            var l=comp.layers.addNull(); l.name=nullR.input.text||"Null 1"; l.label=nextLabel(); l.selected=true;
            app.endUndoGroup();
        };
        bSolid.onClick = function() {
            var comp=getComp(); if(!comp) return;
            app.beginUndoGroup("Add Solid");
            var l=comp.layers.addSolid(nextColor(),solidR.input.text||"Solid 1",comp.width,comp.height,comp.pixelAspect); l.label=nextLabel(); l.selected=true;
            app.endUndoGroup();
        };
        bAdj.onClick = function() {
            var comp=getComp(); if(!comp) return;
            app.beginUndoGroup("Add Adjustment");
            var l=comp.layers.addSolid([1,1,1],adjR.input.text||"Adjustment 1",comp.width,comp.height,comp.pixelAspect); l.adjustmentLayer=true; l.label=nextLabel(); l.selected=true;
            app.endUndoGroup();
        };

        sectionLabel(pC, "Shapes");
        var shR1 = pC.add("group"); shR1.orientation="row"; shR1.spacing=4;
        var shR2 = pC.add("group"); shR2.orientation="row"; shR2.spacing=4;
        var bRect    = addBtn(shR1, "Rectangle", false);
        var bCircle  = addBtn(shR1, "Circle",    false);
        var bRounded = addBtn(shR2, "Rounded",   false);
        var bLine    = addBtn(shR2, "Line",       false);

        function addShapeLayer(type) {
            var comp=getComp(); if(!comp) return;
            app.beginUndoGroup("Add Shape");
            var layer=comp.layers.addShape(); layer.name=type; layer.label=nextLabel();
            var gc=layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
            if(type==="Rectangle"){var s=gc.addProperty("ADBE Vector Shape - Rect");s.property("ADBE Vector Rect Size").setValue([300,200]);}
            else if(type==="Circle"){var s=gc.addProperty("ADBE Vector Shape - Ellipse");s.property("ADBE Vector Ellipse Size").setValue([200,200]);}
            else if(type==="Rounded"){var s=gc.addProperty("ADBE Vector Shape - Rect");s.property("ADBE Vector Rect Size").setValue([300,200]);s.property("ADBE Vector Rect Roundness").setValue(30);}
            else if(type==="Line"){gc.addProperty("ADBE Vector Shape - Group");var st=gc.addProperty("ADBE Vector Graphic - Stroke");st.property("ADBE Vector Stroke Width").setValue(4);}
            if(type!=="Line"){var fill=gc.addProperty("ADBE Vector Graphic - Fill");fill.property("ADBE Vector Fill Color").setValue([0.5,0.3,0.9,1]);}
            layer.selected=true;
            app.endUndoGroup();
        }

        bRect.onClick    = function(){addShapeLayer("Rectangle");};
        bCircle.onClick  = function(){addShapeLayer("Circle");};
        bRounded.onClick = function(){addShapeLayer("Rounded");};
        bLine.onClick    = function(){addShapeLayer("Line");};

        sectionLabel(pC, "Text");
        var txRow = pC.add("group"); txRow.orientation="row"; txRow.spacing=4;
        var bTxt  = addBtn(txRow, "Text",           false);
        var bTxtC = addBtn(txRow, "Centered Title", true);

        bTxt.onClick = function() {
            var comp=getComp(); if(!comp) return;
            app.beginUndoGroup("Add Text");
            var l=comp.layers.addText("Text"); l.label=nextLabel(); l.selected=true;
            app.endUndoGroup();
        };
        bTxtC.onClick = function() {
            var comp=getComp(); if(!comp) return;
            app.beginUndoGroup("Add Centered Title");
            var l=comp.layers.addText("Title");
            var doc=l.property("ADBE Text Properties").property("ADBE Text Document").value;
            doc.justification=ParagraphJustification.CENTER_JUSTIFY;
            l.property("ADBE Text Properties").property("ADBE Text Document").setValue(doc);
            l.property("ADBE Transform Group").property("ADBE Position").setValue([comp.width/2,comp.height/2]);
            l.label=nextLabel(); l.selected=true;
            app.endUndoGroup();
        };

        sectionLabel(pC, "Camera");
        var camRow = pC.add("group"); camRow.orientation="row"; camRow.spacing=4;
        var bCam   = addBtn(camRow, "Add Camera",    false);
        var bOrbit = addBtn(camRow, "3D Orbit Null", false);

        bCam.onClick = function() {
            var comp=getComp(); if(!comp) return;
            app.beginUndoGroup("Add Camera");
            comp.layers.addCamera("Camera 1",[comp.width/2,comp.height/2]);
            app.endUndoGroup();
        };
        bOrbit.onClick = function() {
            var comp=getComp(); if(!comp) return;
            app.beginUndoGroup("3D Orbit Null");
            var l=comp.layers.addNull(); l.name="3D Orbit Null"; l.threeDLayer=true; l.label=nextLabel(); l.selected=true;
            app.endUndoGroup();
        };

        // ════════════════════════════════════════════════════
        // ACTIONS PANEL
        // ════════════════════════════════════════════════════
        var pAct = stack.add("group");
        pAct.orientation   = "column";
        pAct.alignChildren = ["fill","top"];
        pAct.spacing       = 6;
        pAct.visible       = false;

        sectionLabel(pAct, "Precompose");
        var pcR  = addInput(pAct, "Name", "Precomp 1");
        var pcRow = pAct.add("group"); pcRow.orientation="row"; pcRow.spacing=4;
        var bSPC = addBtn(pcRow, "Smart Precomp",  true);
        var bPCO = addBtn(pcRow, "Precomp + Open", false);

        bSPC.onClick = function() {
            var comp=getComp(); if(!comp) return;
            var sel=comp.selectedLayers; if(!sel.length){alert("Select layers.");return;}
            var idx=[]; for(var i=0;i<sel.length;i++) idx.push(sel[i].index);
            idx.sort(function(a,b){return a-b;});
            app.beginUndoGroup("Smart Precomp");
            comp.layers.precompose(idx, pcR.input.text||"Precomp 1", true);
            app.endUndoGroup();
        };
        bPCO.onClick = function() {
            var comp=getComp(); if(!comp) return;
            var sel=comp.selectedLayers; if(!sel.length){alert("Select layers.");return;}
            var idx=[]; for(var i=0;i<sel.length;i++) idx.push(sel[i].index);
            idx.sort(function(a,b){return a-b;});
            var name=pcR.input.text||"Precomp 1";
            app.beginUndoGroup("Precomp + Open");
            comp.layers.precompose(idx, name, true);
            for(var j=1;j<=app.project.numItems;j++){if(app.project.item(j) instanceof CompItem&&app.project.item(j).name===name){app.project.item(j).openInViewer();break;}}
            app.endUndoGroup();
        };

        sectionLabel(pAct, "Layer Tools");
        var lt1 = pAct.add("group"); lt1.orientation="row"; lt1.spacing=4;
        var bTrim = addBtn(lt1, "Trim to Comp", true);
        var bDup  = addBtn(lt1, "Dup + Offset", false);

        var renR  = addInput(pAct, "Name", "New name");
        var lt2   = pAct.add("group"); lt2.orientation="row"; lt2.spacing=4;
        var bRen  = addBtn(lt2, "Rename Selected", false);
        var bDelH = addBtn(lt2, "Delete Hidden",   false);

        bTrim.onClick = function() {
            var comp=getComp(); if(!comp) return;
            var sel=comp.selectedLayers; if(!sel.length){alert("Select layers.");return;}
            app.beginUndoGroup("Trim to Comp");
            for(var i=0;i<sel.length;i++){sel[i].inPoint=comp.workAreaStart;sel[i].outPoint=comp.workAreaStart+comp.workAreaDuration;}
            app.endUndoGroup();
        };
        bDup.onClick = function() {
            var comp=getComp(); if(!comp) return;
            var sel=comp.selectedLayers; if(!sel.length){alert("Select layers.");return;}
            app.beginUndoGroup("Dup + Offset");
            for(var i=0;i<sel.length;i++){var d=sel[i].duplicate();d.startTime=sel[i].startTime+comp.frameDuration*2;}
            app.endUndoGroup();
        };
        bRen.onClick = function() {
            var comp=getComp(); if(!comp) return;
            var sel=comp.selectedLayers; if(!sel.length){alert("Select layers.");return;}
            var name=renR.input.text; if(!name){alert("Enter a name.");return;}
            app.beginUndoGroup("Rename");
            for(var i=0;i<sel.length;i++) sel[i].name=sel.length>1?name+" "+(i+1):name;
            app.endUndoGroup();
        };
        bDelH.onClick = function() {
            var comp=getComp(); if(!comp) return;
            app.beginUndoGroup("Delete Hidden");
            var del=[]; for(var i=1;i<=comp.numLayers;i++) if(!comp.layer(i).enabled) del.push(comp.layer(i));
            for(var j=0;j<del.length;j++) del[j].remove();
            app.endUndoGroup();
            alert("Deleted "+del.length+" hidden layer(s).");
        };

        sectionLabel(pAct, "Parenting");
        var parRow = pAct.add("group"); parRow.orientation="row"; parRow.spacing=4;
        var bAP = addBtn(parRow, "Auto Parent to Null", true);
        var bCN = addBtn(parRow, "Control Null",        false);

        bAP.onClick = function() {
            var comp=getComp(); if(!comp) return;
            var sel=comp.selectedLayers; if(!sel.length){alert("Select layers.");return;}
            app.beginUndoGroup("Auto Parent");
            var nl=comp.layers.addNull(); nl.name="Control Null"; nl.label=nextLabel();
            for(var i=0;i<sel.length;i++) sel[i].parent=nl;
            app.endUndoGroup();
        };
        bCN.onClick = function() {
            var comp=getComp(); if(!comp) return;
            app.beginUndoGroup("Control Null");
            var l=comp.layers.addNull(); l.name="Control Null"; l.label=nextLabel(); l.selected=true;
            app.endUndoGroup();
        };

        sectionLabel(pAct, "Time Pointer");
        var timeR = addInput(pAct, "Frame", "0");
        var bGo   = addBtn(pAct, "Go to Frame", true);
        bGo.onClick = function() {
            var comp=getComp(); if(!comp) return;
            var f=parseInt(timeR.input.text,10); if(isNaN(f)){alert("Enter a valid frame.");return;}
            var t=f/comp.frameRate; if(t<0)t=0; if(t>comp.duration)t=comp.duration;
            comp.time=t;
        };

        // ── Tab switching ─────────────────────────────────────────────────────
        var panels  = [pA,   pC,   pAct];
        var tabBtns = [t0,   t1,   t2  ];

        function activateTab(idx) {
            for (var i = 0; i < panels.length; i++) {
                panels[i].visible = (i === idx);
                setBG(tabBtns[i], i === idx ? C.accent : C.btn);
                setFG(tabBtns[i], i === idx ? C.white  : C.textDim);
            }
            if (win.layout) win.layout.layout(true);
        }

        t0.onClick = function(){ activateTab(0); };
        t1.onClick = function(){ activateTab(1); };
        t2.onClick = function(){ activateTab(2); };
        activateTab(0);

        // ── Show ──────────────────────────────────────────────────────────────
        if (win instanceof Window) {
            win.preferredSize = [290, 540];
            win.center();
            win.show();
        } else {
            win.layout.layout(true);
        }

        return win;
    }

    buildUI(thisObj);

}(this));
