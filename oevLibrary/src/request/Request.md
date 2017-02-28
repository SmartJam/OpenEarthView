overpassJsonRequest

onProgress
onLoad
onError

init
progress
load
error
```
                             -----------------------------------
                            |                                   |
 _______                 ___V_____                              |
|       |  Ready.load() |         |     LoadOverPass.progress() |
| Ready |-----|-------->| Loading |---|-------------------------
|_______|               |_________|   |
                                      |                         _________
                                      | LoadOverPass.success() |         |
                                      '-----|----------------->| Loaded  |
                                      |                        |_________|
                                      |                         ____________
                                      | LoadOverPass.fail()    |            |
                                      '-----|----------------->| LoadFailed |
                                                               |____________|
```
With remote cache:
```
                         _______
                        |       |
                        | Ready |
                        |_______|
                           |
                           - Ready.load()
                           |
                      _____V___________
                     |                 |
                     | LoadRemoteCache |
                     |_________________|
                           |
                           |
     ----------------------------
    |                            |
    - LoadRemoteCache.success()  - LoadRemoteCache.failure()
    |                            |
    |                       _____V________
    |                      |              |
    |                      | LoadOverPass |
    |                      |______________|
    |                            |
    |                            |---------------------------
    |                            |                           |
    |                            - LoadOverPass.success()    - LoadOverPass.failure()
    |                            |                           |
    |                       _____V________             ______V_____
    |                      |              |           |            |
     --------------------->|  LoadedData  |           |  Failure   |
                           |______________|           |____________|
                                 |
                                 |
                                 - isRemoteCacheEmpty()
                                 |
                       __________V______
                      |                 |
                      |  UploadToCache  |
                      |_________________|
                           |
                           - UploadToCache.success()
                         __|__
                        |     |
                        | End |
                        |_____|
```
With local cache:
```
                        _________________
                       |                 |
                       | Ready4LocalLoad |
                       |_________________|
                          |
                          |-----------------------------
                          |                             |
                          - Ready.load()                - Ready.load()
                          | & localUrl !== undefined    | & localUrl === undefined
                          |                             |
                          |                             |
                     _____V________                     |
                    |              |                    |
                    | LocalLoading |                    |
                    |______________|                    |
                          |                             |
                          |                             |
 -------------------------|                             |
|                         |                             |
- LocalLoading.success()  - LocalLoading.fail()         |
|                         |                             |
|                         |                             |
|                 ________V_________                    |
|                |                  |                   |
|                | Ready4RemoteLoad |                   |
|                |__________________|                   |
|                         |                             |
|                         - Ready4RemoteLoad.load()     |
|                         |                             |
|                         |                             |
|                         |                             |
|                         |                             |
|                         |                             |
|                         |   --------------------------
|                         |  |
|                      ___V__V________
|                     |               |
|                     | RemoteLoading |
|                     |_______________|
|                         |
|                         |
|                         |------------------------------
|                         |                              |
|                         - RemoteLoading.success()      - RemoteLoading.fail()
|                         |                              |
|                    _____V___                     ______V_______
|                   |         |                   |              |
 ------------------>| Loaded  |                   |  LoadFailed  |
                    |_________|                   |______________|

```
Full machine state:
```
                        _______
                       |       |
                       | Ready |
                       |_______|
                          |
                          - load()
                          |
                     _____V_____
                    |           |
                    | LocalLoad |
                    |___________|
                          |
                          |
    ----------------------|
   |                      |
   - LoadCache.finish()   - LocalLoad.fail()
   |                      |
                          |
                     _____V____________
                    |                  |
                    | LoadCache(z,x,y) |
                    |__________________|
                          |
                          |
    ----------------------|
   |                      |
   - LoadCache.finish()   - LoadCache.fail()
   |                      |
   |                 _____V________________
   |                |                      |
   |                | LoadOverPass(z,x,y)  |
   |                |______________________|
   |                      |
   |                      |------------------------------
   |                      |                              |
   |                      - LoadOverPass.finish()        - LoadOverPass.fail()
   |                      |                              |
   |                 _____V________________        ______V_____
   |                |                      |      |            |
    --------------->|  ProcessData(z,x,y)  |      |  Failure   |
                    |______________________|      |____________|
                          |
                          |
                          - notAlreadyCached ?
                          |
                      ____V____________________________
                     |                                 |
                     |  UploadDataToCache(z,x,y,data)  |
                     |_________________________________|
                          |
                          - upLoaded
                        __|__
                       |     |
                       | End |
                       |_____|

```
