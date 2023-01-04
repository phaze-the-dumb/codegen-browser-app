const { ipcRenderer } = require('electron');
const { spawn } = require('child_process');
const fse = require('fs-extra');
const util = require('util');
const fs = require('fs');
const extract = require('extract-zip');
const Convert = require('ansi-to-html');
const path = require('path');

let convert = new Convert();
let nameLists = [];
let currentVersion = null;
let devBuild = require('./config.json').devBuild;
let __filepath = path.join(__dirname, '../../../../data')

if(devBuild)
    __filepath = path.join(__dirname, '../data')

if(!fs.existsSync(__filepath))
    fs.mkdirSync(__filepath)

document.addEventListener('DOMContentLoaded', () => {
    fetch('https://api.github.com/repos/phaze-the-dumb/codegen-browser-app/releases').then(data => data.json()).then(data => {
        if(data[0].tag_name !== require('./config.json').appVersion){
            let notif = document.createElement('div');
            notif.className = 'update-notification';
            notif.innerHTML = 'New version found, Click here to download it.';
            notif.onclick = () => 
                ipcRenderer.send('openLink', data[0].html_url);

            document.body.appendChild(notif);

            setTimeout(() => {
                notif.style.right = '10px';
            }, 10)
        }
    })

    document.querySelector('.minimise-container').onclick = () => ipcRenderer.send('minimise');
    document.querySelector('.close-container').onclick = () => ipcRenderer.send('close');
    document.querySelector('.log-bar').onclick = () => 
        document.querySelector('.log-box').style.left = '50%';
    document.querySelector('.log-close').onclick = () => 
        document.querySelector('.log-box').style.left = '150%';

    document.querySelector('#setting-installlocation').innerText = __dirname;
    document.querySelector('#setting-datalocation').innerText = __filepath;
    document.querySelector('#setting-version').innerText = require('./config.json').appVersion;

    let dotnetTest = spawn('dotnet');
    let didDotnetError = false;

    dotnetTest.on('error', () => didDotnetError = true);

    dotnetTest.on('close', ( code ) => {
        if(!didDotnetError)
            document.querySelector('#dotnet-installed').style.display = 'none';
    })

    document.querySelector('#browser-item').addEventListener('click', () => {
        ipcRenderer.send('fetchConfig');
    })

    document.querySelector('#name-search').oninput = () => {
        let query = document.querySelector('#name-search').value.toLowerCase();
        let names = nameLists.filter(x => x.toLowerCase().includes(query));

        let text = '';
        names.forEach(name => {
            text += '<div class="name" id="loadclass-'+name+'">'+name+'</div>';
        })

        document.querySelector('.names-container').innerHTML = text;

        names.forEach(name => {
            document.getElementById('loadclass-'+name).onclick = () => {
                loadClass(name);
            }
        })
    }

    document.querySelector('.version-information').innerHTML = 'Codegen Browser | Version: '+require('./config.json').appVersion;
    document.querySelectorAll('[link]').forEach(link => 
        link.onclick = () => 
            ipcRenderer.send('openLink', link.getAttribute('link')));

    let bodies = document.querySelectorAll('.body');

    bodies.forEach((b, i) => {
        b.style.top = 'calc(50px + ' + i * 100 + '%)';
    })

    document.querySelectorAll('[body]').forEach(link => 
        link.onclick = () => {
            bodies.forEach((b, i) => {
                b.style.top = 'calc(50px + ' + (i - parseInt(link.getAttribute('body'))) * 100 + '%)';
            })
        });

    document.querySelector('.next-btn').onclick = () => {
        document.querySelector('#versionInsaller').style.display = 'block';

        document.querySelector('.log-bar').innerHTML = '🟢 Uploading APK...';
        ipcRenderer.send('log', JSON.stringify({ type: 'info', log: 'Uploading APK' }));

        bodies.forEach((b, i) => {
            b.style.top = 'calc(50px + ' + (i - 3) * 100 + '%)';
        })

        let reader = new FileReader();
        let input = document.querySelector('#apkupload');
        let nameInput = document.querySelector('#version-name');

        reader.onload = () => {
            if(!fs.existsSync(__filepath + '/data/apks'))
                fs.mkdirSync(__filepath + '/data/apks', { recursive: true });

            if(!fs.existsSync(__filepath + '/data/extracted'))
                fs.mkdirSync(__filepath + '/data/extracted', { recursive: true });

            if(!fs.existsSync(__filepath + '/data/codegen'))
                fs.mkdirSync(__filepath + '/data/codegen', { recursive: true });

            if(!fs.existsSync(__filepath + '/data/codegen/names'))
                fs.mkdirSync(__filepath + '/data/codegen/names', { recursive: true });

            fs.writeFileSync(__filepath + '/data/apks/' + nameInput.value + input.files[0].name.replace('.apk', '.zip'), Buffer.from(reader.result));

            document.querySelector('.log-bar').innerHTML = '🟠 No Tasks.';
            ipcRenderer.send('log', JSON.stringify({ type: 'info', log: 'APK Uploaded' }));

            ipcRenderer.send('log', JSON.stringify({ type: 'info', log: 'Adding Version to config' }));
            ipcRenderer.send('config', 'addVersion', { name: nameInput.value, path: nameInput.value + input.files[0].name.replace('.apk', '') });

            document.querySelector('.log-bar').innerHTML = '🟢 Extracting APK...';
            ipcRenderer.send('log', JSON.stringify({ type: 'info', log: 'Extracting APK' }));

            extract(__filepath + '/data/apks/' + nameInput.value + input.files[0].name.replace('.apk', '.zip'), { dir: __filepath + '/data/extracted/'+nameInput.value + input.files[0].name.replace('.apk', '')}).then(() => {
                document.querySelector('.log-bar').innerHTML = '🟠 No Tasks.';
                ipcRenderer.send('log', JSON.stringify({ type: 'info', log: 'Finished Extracting APK' }));

                document.querySelector('.log-bar').innerHTML = '🟢 Dumping DLLs...';
                ipcRenderer.send('log', JSON.stringify({ type: 'info', log: 'Running Il2cpp Dumper' }));

                let il2cpp = spawn('dotnet', [
                    __dirname + '/data/il2cpp/Il2CppDumper.dll',
                    __filepath + '/data/extracted/'+nameInput.value + input.files[0].name.replace('.apk', '')+'/assets/bin/Data/Managed/Metadata/global-metadata.dat',
                    __filepath + '/data/extracted/'+nameInput.value + input.files[0].name.replace('.apk', '')+'/lib/arm64-v8a/libil2cpp.so'
                ]);

                il2cpp.stdout.on('data', ( chunk ) => {
                    ipcRenderer.send('log', JSON.stringify({ type: 'info', log: chunk.toString() }));
                })

                il2cpp.stderr.on('data', ( chunk ) => {
                    ipcRenderer.send('warn', JSON.stringify({ type: 'info', log: chunk.toString() }));
                })

                il2cpp.on('close', () => {
                    document.querySelector('.log-bar').innerHTML = '🟠 No Tasks.';
                    ipcRenderer.send('log', JSON.stringify({ type: 'info', log: 'Finished Dumping DLLs' }));

                    document.querySelector('.log-bar').innerHTML = '🟢 Generating Codegen Headers';
                    ipcRenderer.send('log', JSON.stringify({ type: 'info', log: 'Generating Codegen Headers' }));

                    let cgen = spawn('dotnet', [ __dirname + '/data/cgen/Codegen-CLI.dll' ], { cwd: __filepath + '/data/codegen' });

                    let i = 0;
                    cgen.stdout.on('data', ( chunk ) => {
                        if(i === 0)
                            cgen.stdin.write(__dirname + '/data/il2cpp/DummyDLL' + '\n');

                        if(chunk.toString().includes('Type the name of an output style (or don\'t for Normal) then press enter to serialize:'))
                            cgen.stdin.write('\n');

                        if(chunk.toString().includes('Serialization Complete, took: ')){
                            cgen.kill(0);
                            document.querySelector('.log-bar').innerHTML = '🟠 No Tasks.';
                            ipcRenderer.send('log', JSON.stringify({ type: 'info', log: 'Finished Generating Codegen Headers' }));
                    
                            document.querySelector('.log-bar').innerHTML = '🟢 Setting Up Files...';
                            ipcRenderer.send('log', JSON.stringify({ type: 'info', log: 'Reformatting for Codegen Browser so we don\'t use 4gb of your ram while your trying to browse' }));
                        
                            fs.mkdirSync(__filepath + '/data/codegen/data/'+nameInput.value + input.files[0].name.replace('.apk', ''), { recursive: true });
                            fs.mkdirSync(__filepath + '/data/codegen/cpp/'+nameInput.value + input.files[0].name.replace('.apk', ''), { recursive: true });

                            document.querySelector('.log-bar').innerHTML = '🟢 Moving Header Files...';
                            fse.copySync(__filepath + '/data/codegen/output/include', __filepath + '/data/codegen/cpp/'+nameInput.value + input.files[0].name.replace('.apk', ''));

                            document.querySelector('.log-bar').innerHTML = '🟢 Parsing JSON...';
                            const parsed = require(__filepath + '/data/codegen/json_output/parsed.json');
                            let names = [];

                            parsed.Types.forEach((type, i) => {
                                if(!type.This.Name.includes('d__') && !type.This.Name.includes('DisplayClass')){
                                    names.push(type)
                                    document.querySelector('.log-bar').innerHTML = '🟢 Parsing JSON... (' + i + ' / '+parsed.Types.length + ')';
                                }
                            });

                            ipcRenderer.send('log', JSON.stringify({ type: 'info', log: 'Finished Parsing.' }));

                            names.sort();
                            let namesList = [];

                            document.querySelector('.log-bar').innerHTML = '🟢 Reformatting...';
                            names.forEach((name, i) => {
                                try{
                                    let isDot = false;
                                    if((name.This.QualifiedCppName.split('::').join('.') + '.' + name.This.Name).startsWith('.')){
                                        isDot = true;
                                    }
                        
                                    if(name.This.QualifiedCppName.includes('GlobalNamespace::')){
                                        fs.writeFileSync(__filepath + '/data/codegen/data/'+nameInput.value + input.files[0].name.replace('.apk', '')+'/' + name.This.Name + '.json', JSON.stringify(name));
                                        namesList.push(name.This.Name);
                                    } else{
                                        if(isDot){
                                            fs.writeFileSync(__filepath + '/data/codegen/data/'+nameInput.value + input.files[0].name.replace('.apk', '')+'/' + (name.This.QualifiedCppName.split('::').join('.')).replace('.', '') + '.json', JSON.stringify(name));
                                            namesList.push((name.This.QualifiedCppName.split('::').join('.')).replace('.', ''));
                                        } else{
                                            fs.writeFileSync(__filepath + '/data/codegen/data/'+nameInput.value + input.files[0].name.replace('.apk', '')+'/' + (name.This.QualifiedCppName.split('::').join('.')) + '.json', JSON.stringify(name));
                                            namesList.push((name.This.QualifiedCppName.split('::').join('.')).join('.'));
                                        }
                                    }
                                } catch(e){
                                    console.error(e);
                                    // ipcRenderer.send('log', JSON.stringify({ type: 'error', log: e }));
                                }

                                document.querySelector('.log-bar').innerHTML = '🟢 Reformatting... ('+i+' / '+names.length+')';
                            })

                            console.log(namesList);
                            fs.writeFileSync(__filepath + '/data/codegen/names/'+nameInput.value + input.files[0].name.replace('.apk', '')+'.json', JSON.stringify(namesList));

                            document.querySelector('.log-bar').innerHTML = '🟠 Done, No Tasks Left.';
                            document.querySelector('#versionInsaller').style.display = 'none';

                            bodies.forEach((b, i) => {
                                b.style.top = 'calc(50px + ' + (i - 4) * 100 + '%)';
                            })
                            ipcRenderer.send('fetchConfig');
                        }

                        ipcRenderer.send('log', JSON.stringify({ type: 'info', log: chunk.toString() }));
                        i++
                    })

                    cgen.stderr.on('data', ( chunk ) => {
                        ipcRenderer.send('warn', JSON.stringify({ type: 'info', log: chunk.toString() }));
                    })
                })
            }).catch(e => {
                document.querySelector('.log-bar').innerHTML = '🔴 '+e.toString();
                ipcRenderer.send('log', JSON.stringify({ type: 'error', log: e.toString() }));
            })
        }

        reader.readAsArrayBuffer(input.files[0]);
    }

    ipcRenderer.send('load');
})

ipcRenderer.on('logs', ( event, logs ) => {
    logs = JSON.parse(logs);

    let text = '';
    let containers = document.querySelectorAll('.logs-container');

    logs.forEach(log => {
        if(log.type === 'error')
            text += '<span class="log-error">'+log.log+'</span><br />'
        else if(log.type === 'warn')
            text += '<span class="log-warn">'+log.log+'</span><br />'
        else if(log.type === 'info')
            text += '<span class="log-info">'+log.log+'</span><br />'
        else
            text += '<span>'+log.log+'</span><br />'
    });

    containers.forEach(container => {
        if(
            container.scrollTop +
            container.clientHeight ==
            container.scrollHeight
        ) container.autoScroll = true;
        else container.autoScroll = false;
    
        container.innerHTML = text;
    
        if(container.autoScroll)
            container.scrollBy(0, 100000);
    })
})

ipcRenderer.on('fetchConfig', ( e, config ) => {
    config = JSON.parse(config);
    console.log(config);

    let text = '';
    config.versions.forEach(ver => {
        console.log(ver)
        text += '<div class="version-header" id="'+ver.name+'-loadbtn">' + ver.name + '</div>';
    })

    document.querySelector('.version-list').innerHTML = text;

    config.versions.forEach(ver => {
        document.getElementById(ver.name+'-loadbtn').onclick = () => {
            currentVersion = ver.path;
            let names = fs.readFileSync(__filepath + '/data/codegen/names/'+ver.path+'.json').toString();
            console.log(names);

            names = JSON.parse(names);
            nameLists = names;

            let text = '';
            names.forEach(name => {
                text += '<div class="name" id="loadclass-'+name+'">'+name+'</div>';
            })

            document.querySelector('.names-container').innerHTML = text;

            names.forEach(name => {
                document.getElementById('loadclass-'+name).onclick = () => {
                    loadClass(name);
                }
            })
        }
    })
})

let loadClass = ( name ) => {
    document.querySelector('.class-container').style.textAlign = 'center';
    document.querySelector('.class-container').innerHTML = 'Loading '+name+'...';

    let data = JSON.parse(fs.readFileSync(__filepath + '/data/codegen/data/'+currentVersion+'/'+name+'.json'));
    console.log(data);

    let text = '';

    text += '<h1>Info: '+name+'</h1>';
    if(data.Parent)
        text += 'Parent: '+getNamespace(data.Parent.Namespace) + '.' + data.Parent.Name + '<br />';
    else
        text += 'Parent: None<br />';

    text += 'Is Nested: '+data.This.IsNested+'<br />';
    text += 'Is Generic Template: '+data.This.IsGenericTemplate+'<br />';

    console.log('Checking: ' + __filepath + '/data/codegen/cpp/'+currentVersion+'/'+getNamespaceNoDot(data.This.QualifiedCppName.split('::')[1])+'/'+data.This.QualifiedCppName.split('::')[2]+'.hpp for header files');
    if(fs.existsSync(__filepath + '/data/codegen/cpp/'+currentVersion+'/'+getNamespaceNoDot(data.This.QualifiedCppName.split('::')[1])+'/'+data.This.QualifiedCppName.split('::')[2]+'.hpp'))
        text += '<span class="link" body="5">View Header Source</span><br />';

    text += '<br /><div><input type="checkbox">Display JSON Code.<div class="code json">'+formatJSON(data.This)+'</div></div>'

    text += '<h1>Instance Fields</h1>';
    data.InstanceFields.forEach(instanceField => {
        text += '<div class="cls">' + instanceField.Name + ': <span class="TypeName">' + getNamespace(instanceField.Type.Namespace) +instanceField.Type.Name + '</span><br /><input type="checkbox">Display JSON Code.<div class="code json">'+formatJSON(instanceField)+'</div></div><br />';
    })

    text += '<br />';
    text += '<h1>Methods / Hooks</h1>';
    data.Methods.forEach((method, i) => {
        let args = [];
        method.Parameters.forEach(p => {
            args.push(p.Name + ': ' + p.Type.Namespace + '.' + p.Type.Name)
        })

        text += '<div class="cls">' + method.Name + '(' + args.join(', ') + '): <span class="TypeName">' + getNamespace(method.ReturnType.Namespace) + method.ReturnType.Name + '</span><br /><input type="checkbox">Display JSON Code.<div class="code json">'+formatJSON(method)+'</div></div><br />';
    })

    text += '<br />';
    text += '<h1>Static Fields</h1>';
    data.StaticFields.forEach(field => {
        text += '<div class="cls">' + field.Name + ': <span class="TypeName">' + getNamespace(field.Type.Namespace) + field.Type.Name + '</span><br /><input type="checkbox">Display JSON Code.<div class="code json">'+formatJSON(field)+'</div></div><br />';
    })

    document.querySelector('.class-container').style.textAlign = 'left';
    document.querySelector('.class-container').innerHTML = text;

    let bodies = document.querySelectorAll('.body');
    document.querySelectorAll('[body]').forEach(link => 
        link.onclick = () => {
            bodies.forEach((b, i) => {
                b.style.top = 'calc(50px + ' + (i - parseInt(link.getAttribute('body'))) * 100 + '%)';
            })
        });

    if(fs.existsSync(__filepath + '/data/codegen/cpp/'+currentVersion+'/'+getNamespaceNoDot(data.This.QualifiedCppName.split('::')[1])+'/'+data.This.QualifiedCppName.split('::')[2]+'.hpp')){
        let headerFile = fs.readFileSync(__filepath + '/data/codegen/cpp/'+currentVersion+'/'+getNamespaceNoDot(data.This.QualifiedCppName.split('::')[1])+'/'+data.This.QualifiedCppName.split('::')[2]+'.hpp');

        document.querySelector('#header-file').innerHTML = colourCode(headerFile.toString());
        document.querySelector('.code-header').innerHTML = getNamespaceNoDot(data.This.QualifiedCppName.split('::')[1])+'/'+data.This.QualifiedCppName.split('::')[2]+'.hpp';
    }
}

let getName = ( name ) => {
    if(name === 'Single')
        return 'float'
    else if(name === 'Boolean')
        return 'bool'
    else if(name === 'Int32')
        return 'int'
    else if(name === 'String')
        return 'string'
    else
        return name.toLowerCase();
}

let getNamespaceNoDot = ( ns ) => {
    if(ns.toLowerCase() === 'system')
        return '';
    else if(ns === '')
        return 'GlobalNamespace';
    else
        return ns;
}

let getNamespace = ( ns ) => {
    if(ns.toLowerCase() === 'system')
        return '';
    else if(ns === '')
        return 'GlobalNamespace.';
    else
        return ns + '.';
}

let formatJSON = (json) => {
    let utilFormat = util.inspect(json, true, 100000, true).split(' ').join('&nbsp;');
    let colourFormat = convert.toHtml(utilFormat);

    let js = colourFormat.split('\n').join('<br />');
    js = js.split('<span style="color:#A50">').join('<span class="TypeName">')
    js = js.split('<span style="color:#0A0">').join('<span class="strText">')
    return js
}

let colourCode = ( data ) => {
    let text = '';

    data.split('\n').forEach(name => {
        if(name === '')name = '&nbsp;';
        name = name.split('<').join('&#60;');
        name = name.split('>').join('&#62;');

        if(name.trim().startsWith('//')){
            let tabs = '&nbsp;'

            name = name.split(' ').join(tabs);
            text += '<div class="className"><span class="comment">'+name+'</span></div>'
        } else{
            let tabs = '&nbsp;'

            let intext = false;
            let newText = '';
            name = name.split(' ').join(tabs);

            name.split('').forEach(char => {
                if(char === '"'){
                    if(intext === true){
                        intext = false;
                        newText += char+'</span>'
                    } else{
                        intext = true;
                        newText += '<span class="strText">'+char
                    }
                } else{
                    newText += char
                }
            })

            name = newText;

            name = name.split('int&nbsp;').join('<span class="TypeName">int </span>');
            name = name.split('void&nbsp;').join('<span class="TypeName">void </span>');
            name = name.split('float&nbsp;').join('<span class="TypeName">float </span>');
            name = name.split('double&nbsp;').join('<span class="TypeName">double </span>');
            name = name.split('bool&nbsp;').join('<span class="TypeName">bool </span>');
            name = name.split('char&nbsp;').join('<span class="TypeName">char </span>');
            name = name.split('static&nbsp;').join('<span class="StaticName">static </span>');
            name = name.split('return&nbsp;').join('<span class="StaticName">return </span>');
            name = name.split('#include&nbsp;').join('<span class="IncludeName">#include </span>');
            name = name.split('struct&nbsp;').join('<span class="IncludeName">struct </span>');
            name = name.split('namespace&nbsp;').join('<span class="IncludeName">namespace </span>');
            name = name.split('GlobalNamespace').join('<span class="nameSpaceType">GlobalNamespace</span>');

            text += '<div class="className">'+name+'</div>'
        }
    });

    return text;
}