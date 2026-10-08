package com.games.wenzi.taoyuan;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CloudSave")
public class CloudSavePlugin extends Plugin {

    @Override
    public void load() {
    }

    @PluginMethod
    public void initSdk(PluginCall call) {
        call.reject("功能已移除");
    }

    @PluginMethod
    public void uploadSave(PluginCall call) {
        call.reject("功能已移除");
    }

    @PluginMethod
    public void downloadSave(PluginCall call) {
        call.reject("功能已移除");
    }

    @PluginMethod
    public void login(PluginCall call) {
        call.reject("功能已移除");
    }

    @PluginMethod
    public void logout(PluginCall call) {
        call.reject("功能已移除");
    }

    @PluginMethod
    public void getLoginStatus(PluginCall call) {
        call.reject("功能已移除");
    }

    @PluginMethod
    public void requestReview(PluginCall call) {
        call.reject("功能已移除");
    }
}
