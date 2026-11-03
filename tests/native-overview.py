# SPDX-License-Identifier: GPL-3.0-only
"""Private labwc + actual Qt controls/processes; compositor metadata is a fixture."""
import hashlib
import json
import os
from pathlib import Path
import queue
import threading
import shutil
import stat
import subprocess
import time

assert os.environ.get('OVERVIEW_SANDBOX') == '1', 'use native-overview.test.sh'
ROOT = Path('/work')
RUNTIME = ROOT / Path(json.loads((ROOT/'manifest.json').read_text())['entryPoints']['overlay']).parent
for name in ['home', 'runtime', 'host', 'labwc']:
    Path('/tmp', name).mkdir(mode=0o700, exist_ok=True)
host = Path('/tmp/host')
for name in ['Commons', 'services', 'plugins']:
    (host/name).symlink_to('/usr/share/omarchy/shell/'+name)
shutil.copytree('/usr/share/omarchy/shell/Ui', host/'Ui')
# Only the shell output-selection facade is replaced; all controls use installed native tokens.
(host/'Ui/OverlayWindow.qml').write_text('''import QtQuick
import Quickshell
import Quickshell.Wayland
PanelWindow {
 property bool shown:false
 property var targetScreen:Quickshell.screens[0]
 visible:shown
 implicitWidth:Number(Quickshell.env("PROOF_WIDTH"))
 implicitHeight:Number(Quickshell.env("PROOF_HEIGHT"))
 WlrLayershell.keyboardFocus:WlrKeyboardFocus.Exclusive
 WlrLayershell.layer:WlrLayer.Overlay
 color:"transparent"
}''')
shutil.copytree(RUNTIME, host/'runtime')
fixture = host/'runtime/fixtures'
fixture.mkdir()
(fixture/'qmldir').write_text('singleton Hyprland 1.0 Hyprland.qml\n')
(fixture/'Hyprland.qml').write_text('''pragma Singleton
import QtQuick
QtObject { property var focusedWorkspace:({id:3}); signal rawEvent(var event) }
''')
source = (RUNTIME/'Overview.qml').read_text()
if os.environ.get('OVERVIEW_MUTATION'):
    assert os.environ['OVERVIEW_MUTATION'] == 'capture-when-off', 'unknown native mutation'
    before = 'root.options.thumbnails && (wide || height >= Style.space(180))'
    assert source.count(before) == 1, 'mutation source guard must match'
    source = source.replace(before, '(wide || height >= Style.space(180))')
source = source.replace('import Quickshell.Hyprland', 'import "fixtures"')
source = source.replace('id: root', '''id: root
    property alias proofPanel: panel
    property alias proofPreferences: PREFERENCE_ID
    property alias proofRefresh: refresh
    property alias proofLock: lockProbe
    property alias proofTimer: updateTimer
''', 1).replace('PREFERENCE_ID', 'preferenceIO' if 'id: preferenceIO' in source else 'refresh')
(host/'runtime/Overview.qml').write_text(source)
(host/'shell.qml').write_text('''import QtQuick
import Quickshell
import qs.Commons
import "runtime"
ShellRoot {
 id:h
 property int stage:0
 property int ticks:0
 property int assertions:0
 property var seenFields:({})
 function check(ok,message) { assertions++; if(!ok) { console.log("FAIL "+message); Qt.exit(1); throw new Error(message); } }
 function find(item,name) {
  if(item.objectName===name) return item;
  var children=item.children || [];
  for(var i=0;i<children.length;i++) {var got=find(children[i],name);if(got)return got;}
  return null;
 }
 function focused(item) {
  if(item.activeFocus) return true;
  for(var i=0;i<item.children.length;i++) if(focused(item.children[i])) return true;
  return false;
 }
 function settingsGeometry() {
  var scroll=find(view.proofPanel.contentItem,"overview-settings-scroll");
  for(var name of ["defaultScope","sortOrder","thumbnails"]) {
   var control=find(view.proofPanel.contentItem,"overview-option-"+name);
   if(control && focused(control) && !control.popupOpen) {
    var at=control.mapToItem(scroll,0,0);
    check(at.y>=-1 && at.y+control.height<=scroll.height+1,"focused settings control fully visible: "+name);
    if(!h.seenFields[name]) {h.seenFields[name]=true;h.shot("focus-"+name);}
   }
  }
 }
 function shot(name) {
  var card=find(view.proofPanel.contentItem,"overview-card");
  check(card!==null,"native card exists");
  card.grabToImage(function(result) {check(result.saveToFile("/evidence/"+Quickshell.env("PROOF_NAME")+"-"+name+".png"),"capture saved");});
 }
 function layout() {
  var card=find(view.proofPanel.contentItem,"overview-card");
  var list=find(view.proofPanel.contentItem,"overview-results");
  var preview=find(view.proofPanel.contentItem,"overview-preview");
  var footer=find(view.proofPanel.contentItem,"overview-footer");
  check(card && list && preview && footer,"named native geometry");
  console.log("RAW-GEOMETRY "+JSON.stringify({cardWidth:card.width,cardHeight:card.height,listWidth:list.width,listHeight:list.height,footerY:footer.y}));
  check(list.width>150 && list.height>30,"usable contained result list");
  var p=list.mapToItem(card,0,0), f=footer.mapToItem(card,0,0);
  check(p.y+list.height<=f.y+1,"list does not overlap footer");
  var children=list.contentItem.children;
  for(var i=0;i<children.length;i++) {
   var row=children[i];if(row.objectName!=="overview-result-row")continue;
   var text=find(row,"overview-row-text");
   check(text && text.y>=0 && text.y+text.height<=row.height,"real font row line boxes contained");
  }
  check(Style.font.body===Number(Quickshell.env("PROOF_FONT")),"requested real font metrics active");
  console.log("GEOMETRY "+JSON.stringify({width:card.width,height:card.height,listWidth:list.width,listHeight:list.height,font:Style.font.menuFamily,body:Style.font.body}));
 }
 Overview {id:view}
 Component.onCompleted: initialize.start()
 Timer {id:initialize;interval:700;onTriggered:{Style.fontBaseSize=Number(Quickshell.env("PROOF_FONT"));view.open("{}");}}
 Timer {
  interval:100;running:true;repeat:true
  onTriggered: {
   ticks++;if(ticks>160) {console.log("FAIL native scenario watchdog stage="+h.stage);Qt.exit(1);}
   if(view.configuring) h.settingsGeometry();
   if(h.stage===0 && view.opened && view.matches.length===3) {
    h.check(typeof view.featureRevision==="function" && view.featureRevision()==="0.3.1","featureRevision literal");
    h.layout();h.shot("command");h.stage=1;console.log("READY configure");
   } else if(h.stage===1 && view.configuring) {
    h.check(!h.find(view.proofPanel.contentItem,"overview-preview-loader").active,"Configure releases preview");
    h.shot("configure");h.stage=2;console.log("READY edit");
   } else if(h.stage===2 && view.options.defaultScope==="current" && view.options.sortOrder==="name" && !view.options.thumbnails && !view.proofPreferences.running) {
    h.check(view.workspaceOnly && view.matches.length===2 && view.matches[0].address==="0x2","saved scope and stable sorting applied");
    h.shot("saved");h.stage=3;console.log("READY back");
   } else if(h.stage===3 && !view.configuring) {
    h.check(!h.find(view.proofPanel.contentItem,"overview-preview-loader").active,"disabled thumbnails never capture");
    view.close();view.open("{}");h.stage=4;
   } else if(h.stage===4 && view.opened && view.matches.length===2 && !view.proofPreferences.running) {
    h.check(view.workspaceOnly && !view.options.thumbnails,"saved readback after reopen");
    h.check(!h.find(view.proofPanel.contentItem,"overview-preview-loader").active,"reopen thumbnails off never starts capture");
    h.stage=5;console.log("READY configure-reset");
   } else if(h.stage===5 && view.configuring) {h.stage=6;console.log("READY reset");
   } else if(h.stage===6 && view.options.defaultScope==="all" && view.options.sortOrder==="existing" && view.options.thumbnails && !view.proofPreferences.running) {
    h.check(view.matches.length===3 && !view.workspaceOnly,"Reset applies defaults only");
    view.close();h.stage=7;ticks=0;
   } else if(h.stage===7 && ticks>40) {
    h.check(!view.opened && !view.proofLock.running && !view.proofRefresh.running && !view.proofPreferences.running && !view.proofTimer.running,"close stops owned timers/helpers");
    h.check(!h.find(view.proofPanel.contentItem,"overview-preview-loader").active,"close destroys capture");
    h.check(Object.keys(h.seenFields).length===3,"all settings controls reached by native keys");
    console.log("NATIVE_ASSERTIONS "+h.assertions);
    console.log("PASS native-overview scenario");Qt.exit(0);
   }
  }
 }
}''')
Path('/tmp/labwc/rc.xml').write_text('<labwc_config/>')
Path('/tmp/labwc/autostart').write_text('')
env = dict(os.environ, WLR_BACKENDS='headless', WLR_RENDERER='pixman', WLR_HEADLESS_OUTPUTS='1',
           WLR_LIBINPUT_NO_DEVICES='1', XDG_CONFIG_DIRS='/nonexistent', QT_QPA_PLATFORM='wayland')
compositor = subprocess.Popen(['/usr/bin/labwc','-C','/tmp/labwc'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
results=[]
sockets=[]
try:
    for _ in range(100):
        assert compositor.poll() is None, 'private compositor failed'
        sockets=[p for p in Path('/tmp/runtime').glob('wayland-*') if stat.S_ISSOCK(p.stat().st_mode)]
        if sockets:break
        time.sleep(.05)
    assert sockets, 'private compositor socket absent'
    env['WAYLAND_DISPLAY']=sockets[0].name
    for name,width,height,font in [('wide',1280,720,12),('compact',480,360,12),('tall-font',800,600,18),('compact-tall',480,360,18)]:
        env.update(PROOF_NAME=name,PROOF_WIDTH=str(width),PROOF_HEIGHT=str(height),PROOF_FONT=str(font))
        log=[]
        process=subprocess.Popen(['/usr/bin/qs','-n','-p',str(host)],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1)
        assert process.stdout is not None
        lines=queue.Queue()
        def collect(stream):
            for line in stream: lines.put(line)
        reader=threading.Thread(target=collect,args=(process.stdout,),daemon=True);reader.start()
        began=time.monotonic()
        try:
            while (process.poll() is None or not lines.empty()) and time.monotonic()-began<35:
                try: line=lines.get(timeout=.2)
                except queue.Empty: continue
                log.append(line);print(line,end='',flush=True)
                if 'READY configure' in line:
                    keys=['-M','ctrl','-k','comma','-m','ctrl']
                elif 'READY edit' in line:
                    keys=['-k','Down','-k','Down','-k','Return','-k','Tab',
                          '-k','Down','-k','Down','-k','Return','-k','Tab','-k','space','-k','Tab','-k','Return']
                elif 'READY back' in line:keys=['-k','Escape']
                elif 'READY reset' in line:keys=['-k','Tab','-k','Tab','-k','Tab','-k','Tab','-k','Return']
                else:continue
                paced=[]
                for i in range(0,len(keys),2): paced.extend(keys[i:i+2]+['-s','100'])
                time.sleep(.2)
                subprocess.run(['/usr/bin/wtype',*paced],env=env,check=True,timeout=8)
            if process.poll() is None:process.kill()
            process.wait(timeout=5);reader.join(timeout=2)
            while not lines.empty():
                line=lines.get_nowait();log.append(line);print(line,end='')
        finally:
            if process.poll() is None:process.kill();process.wait()
            reader.join(timeout=2)
        text=''.join(log)
        Path('/evidence',name+'.log').write_text(text)
        assert process.returncode==0 and 'PASS native-overview scenario' in text, name+' native verdict'
        assert not any(s in text for s in ['FAIL ', 'ReferenceError','TypeError','Error:', 'Detected recursive','Binding loop']), name+' native warnings'
        store=Path('/tmp/home/.config/omarchy/lego/native-overview/preferences.json')
        assert json.loads(store.read_text())['options']=={'defaultScope':'all','sortOrder':'existing','thumbnails':True}
        import re
        counted=re.search(r'NATIVE_ASSERTIONS (\d+)',text)
        assert counted is not None
        checks=int(counted.group(1))
        assert 'native-overview preview-created' not in text.split('READY back')[1].split('READY configure-reset')[0], 'thumbnail off reopen must not instantiate capture'
        results.append({'name':name,'width':width,'height':height,'fontBase':font,'assertions':checks,'passed':True})
    actions=Path('/tmp/actions.log').read_text().splitlines()
    assert not any(json.loads(line)[0:1]==['dispatch'] for line in actions), 'settings must not dispatch'
    Path('/evidence/native.json').write_text(json.dumps({'cases':results,'count':len(results),'sourceSHA':'0ccd31a7ea38bdba72eeeb11f7b88e7e873b013f',
        'runtimeHashes':{str(p.relative_to(RUNTIME)):hashlib.sha256(p.read_bytes()).hexdigest() for p in RUNTIME.rglob('*') if p.is_file()},
        'limits':['private labwc/software; fixture clients, lock and shell output facade; no live compositor action/capture/upgrade proof'],
        'noDispatch':True},indent=2)+'\n')
    print('RESULT '+str(len(results))+' native scenarios passed')
finally:
    compositor.terminate()
    try:compositor.wait(timeout=3)
    except subprocess.TimeoutExpired:compositor.kill();compositor.wait()
