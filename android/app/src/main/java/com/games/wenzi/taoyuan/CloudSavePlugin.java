package com.games.wenzi.taoyuan;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.taptap.sdk.cloudsave.ArchiveData;
import com.taptap.sdk.cloudsave.ArchiveMetadata;
import com.taptap.sdk.cloudsave.TapTapCloudSave;
import com.taptap.sdk.cloudsave.internal.TapCloudSaveCallback;
import com.taptap.sdk.cloudsave.internal.TapCloudSaveRequestCallback;
import com.taptap.sdk.kit.internal.callback.TapTapCallback;
import com.taptap.sdk.login.TapTapAccount;
import com.taptap.sdk.login.TapTapLogin;
import com.taptap.sdk.review.TapTapReview;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

@CapacitorPlugin(name = "CloudSave")
public class CloudSavePlugin extends Plugin {

    private static final String UUID_PREFS = "taptap_cloud";

    @Override
    public void load() {
        TapTapCloudSave.registerCloudSaveCallback(new TapCloudSaveCallback() {
            @Override
            public void onResult(int resultCode) {
                // 300001: 需要登录, 300002: 初始化失败
            }
        });
    }

    // ── 上传存档 ──────────────────────────────────────────────────
    @PluginMethod
    public void uploadSave(PluginCall call) {
        int slot = call.getInt("slot", -1);
        String data = call.getString("data");
        if (slot < 0 || data == null) {
            call.reject("参数错误");
            return;
        }

        File file = getTempFile(slot);
        if (!writeFile(file, data)) {
            call.reject("写临时文件失败");
            return;
        }

        String cachedUuid = getContext()
                .getSharedPreferences(UUID_PREFS, 0)
                .getString("uuid_slot_" + slot, null);

        ArchiveMetadata metadata = new ArchiveMetadata.Builder()
                .setName("taoyuan_slot_" + slot)
                .setSummary("slot" + slot)
                .build();

        if (cachedUuid != null) {
            TapTapCloudSave.updateArchive(cachedUuid, metadata, file.getAbsolutePath(), null,
                    new TapCloudSaveRequestCallback() {
                        @Override public void onArchiveCreated(@NonNull ArchiveData a) {}
                        @Override public void onArchiveUpdated(@NonNull ArchiveData a) {
                            call.resolve(new JSObject().put("success", true));
                        }
                        @Override public void onArchiveDeleted(@NonNull ArchiveData a) {}
                        @Override public void onArchiveListResult(@NonNull List<ArchiveData> l) {}
                        @Override public void onArchiveDataResult(@NonNull byte[] d) {}
                        @Override public void onArchiveCoverResult(@NonNull byte[] c) {}
                        @Override public void onRequestError(int code, @NonNull String msg) {
                            createArchive(call, slot, metadata, file);
                        }
                    });
        } else {
            createArchive(call, slot, metadata, file);
        }
    }

    // ── 下载存档 ──────────────────────────────────────────────────

    @PluginMethod
    public void downloadSave(PluginCall call) {
        int slot = call.getInt("slot", -1);
        if (slot < 0) {
            call.reject("参数错误");
            return;
        }

        TapTapCloudSave.getArchiveList(new TapCloudSaveRequestCallback() {
            @Override public void onArchiveCreated(@NonNull ArchiveData a) {}
            @Override public void onArchiveUpdated(@NonNull ArchiveData a) {}
            @Override public void onArchiveDeleted(@NonNull ArchiveData a) {}
            @Override public void onArchiveListResult(@NonNull List<ArchiveData> archiveList) {
                ArchiveData target = null;
                for (ArchiveData a : archiveList) {
                    if (("slot" + slot).equals(a.getSummary())) {
                        target = a;
                        break;
                    }
                }
                if (target == null) {
                    JSObject res = new JSObject();
                    res.put("data", (Object) null);
                    call.resolve(res);
                    return;
                }

                final ArchiveData finalTarget = target;
                TapTapCloudSave.getArchiveData(finalTarget.getUuid(), finalTarget.getFileId(),
                        new TapCloudSaveRequestCallback() {
                            @Override public void onArchiveCreated(@NonNull ArchiveData a) {}
                            @Override public void onArchiveUpdated(@NonNull ArchiveData a) {}
                            @Override public void onArchiveDeleted(@NonNull ArchiveData a) {}
                            @Override public void onArchiveListResult(@NonNull List<ArchiveData> l) {}
                            @Override public void onArchiveDataResult(@NonNull byte[] archiveData) {
                                getContext().getSharedPreferences(UUID_PREFS, 0)
                                        .edit()
                                        .putString("uuid_slot_" + slot, finalTarget.getUuid())
                                        .apply();
                                String content = new String(archiveData, StandardCharsets.UTF_8);
                                call.resolve(new JSObject().put("data", content));
                            }
                            @Override public void onArchiveCoverResult(@NonNull byte[] c) {}
                            @Override public void onRequestError(int code, @NonNull String msg) {
                                call.reject("下载失败: " + code + " " + msg);
                            }
                        });
            }
            @Override public void onArchiveDataResult(@NonNull byte[] d) {}
            @Override public void onArchiveCoverResult(@NonNull byte[] c) {}
            @Override public void onRequestError(int code, @NonNull String msg) {
                call.reject("获取存档列表失败: " + code + " " + msg);
            }
        });
    }

    // ── TapTap 登录 ───────────────────────────────────────────────
    @PluginMethod
    public void login(PluginCall call) {
        String[] scopes = new String[]{"public_profile"};
        TapTapLogin.loginWithScopes(getActivity(), scopes, new TapTapCallback<TapTapAccount>() {
            @Override
            public void onSuccess(TapTapAccount account) {
                JSObject res = new JSObject();
                res.put("success", true);
                res.put("openId", account != null ? account.getOpenId() : "");
                call.resolve(res);
            }
            @Override
            public void onFail(@NonNull com.taptap.sdk.kit.internal.exception.TapTapException e) {
                call.reject("登录失败: " + e.getMessage());
            }
            @Override
            public void onCancel() {
                call.reject("用户取消登录");
            }
        });
    }

    @PluginMethod
    public void logout(PluginCall call) {
        TapTapLogin.logout();
        call.resolve(new JSObject().put("success", true));
    }

    @PluginMethod
    public void getLoginStatus(PluginCall call) {
        TapTapAccount account = TapTapLogin.getCurrentTapAccount();
        JSObject res = new JSObject();
        res.put("loggedIn", account != null);
        if (account != null) {
            res.put("openId", account.getOpenId());
        }
        call.resolve(res);
    }

    // ── TapTap 评价引导 ───────────────────────────────────────────
    @PluginMethod
    public void requestReview(PluginCall call) {
        TapTapReview.openReview();
        call.resolve(new JSObject().put("success", true));
    }

    // ── 私有方法 ──────────────────────────────────────────────────

    private void createArchive(PluginCall call, int slot, ArchiveMetadata metadata, File file) {
        TapTapCloudSave.createArchive(metadata, file.getAbsolutePath(), null,
                new TapCloudSaveRequestCallback() {
                    @Override public void onArchiveCreated(@NonNull ArchiveData archive) {
                        getContext().getSharedPreferences(UUID_PREFS, 0)
                                .edit()
                                .putString("uuid_slot_" + slot, archive.getUuid())
                                .apply();
                        call.resolve(new JSObject().put("success", true));
                    }
                    @Override public void onArchiveUpdated(@NonNull ArchiveData a) {}
                    @Override public void onArchiveDeleted(@NonNull ArchiveData a) {}
                    @Override public void onArchiveListResult(@NonNull List<ArchiveData> l) {}
                    @Override public void onArchiveDataResult(@NonNull byte[] d) {}
                    @Override public void onArchiveCoverResult(@NonNull byte[] c) {}
                    @Override public void onRequestError(int code, @NonNull String msg) {
                        call.reject("创建失败: " + code + " " + msg);
                    }
                });
    }

    private boolean writeFile(File file, String content) {
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(content.getBytes(StandardCharsets.UTF_8));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private File getTempFile(int slot) {
        return new File(getContext().getFilesDir(), "taoyuan_slot_" + slot + ".enc");
    }
}
