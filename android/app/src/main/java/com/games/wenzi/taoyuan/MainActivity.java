package com.games.wenzi.taoyuan;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;
import com.taptap.sdk.core.TapTapSdk;
import com.taptap.sdk.core.TapTapSdkOptions;
import com.taptap.sdk.core.TapTapRegion;

import java.util.Map;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    private static final String CLIENT_ID = "ig7clxtyydtnq4s7mi";
    private static final String CLIENT_TOKEN = "4fRyeIxwIfei5YnbrYlIOO3uK8b28krXR4PzWwpb";

    private View loadingOverlay;
    private View enterButton;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean loadingDismissed = false;
    private SaveMigrator migrator;
    private Runnable enterButtonRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 注册 Capacitor Plugin（必须在 super.onCreate 之前）
        registerPlugin(CloudSavePlugin.class);

        super.onCreate(savedInstanceState);

        // 初始化 TDS SDK
        TapTapSdkOptions options = new TapTapSdkOptions(
            CLIENT_ID,
            CLIENT_TOKEN,
            TapTapRegion.CN
        );
        TapTapSdk.init(this, options);

        // 沉浸式状态栏
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);

        // BridgeActivity 已创建自己的 WebView 布局，手动 inflate 遮罩层叠加到上面
        loadingOverlay = getLayoutInflater().inflate(R.layout.activity_main, null);
        addContentView(loadingOverlay, new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        enterButton = loadingOverlay.findViewById(R.id.enterButton);

        // 点击"进入游戏"手动关闭遮罩
        enterButton.setOnClickListener(v -> dismissLoading());

        // 5秒后如果还没加载完，显示进入按钮
        enterButtonRunnable = () -> {
            if (!loadingDismissed && enterButton != null) {
                enterButton.setVisibility(View.VISIBLE);
                enterButton.setAlpha(0f);
                enterButton.animate().alpha(1f).setDuration(300).start();
            }
        };
        handler.postDelayed(enterButtonRunnable, 5000);

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // 注册 JS 接口，让 WebView 可以通知 Native 隐藏遮罩
            webView.addJavascriptInterface(new Object() {
                @android.webkit.JavascriptInterface
                public void hideLoading() {
                    runOnUiThread(() -> dismissLoading());
                }
            }, "NativeApp");

            // 延迟注入轮询脚本，等 Capacitor 加载页面后检测 Vue 渲染完成
            handler.postDelayed(() -> {
                WebView wv = getBridge().getWebView();
                if (wv != null) {
                    wv.evaluateJavascript(
                        "(function check() {" +
                        "  var app = document.getElementById('app');" +
                        "  if (app && app.children.length > 0) {" +
                        "    NativeApp.hideLoading();" +
                        "  } else {" +
                        "    setTimeout(check, 200);" +
                        "  }" +
                        "})();",
                        null
                    );
                }
            }, 500);

            // 存档迁移：从旧版 http://localhost:8080 迁移到 Capacitor 的 https://localhost
            migrator = new SaveMigrator(this);
            migrator.migrate(new SaveMigrator.OnMigrationListener() {
                @Override
                public void onMigrationComplete(Map<String, String> saves) {
                    Log.d(TAG, "存档迁移成功，共 " + saves.size() + " 条，等待注入...");
                    // 延迟注入，确保 Capacitor WebView 页面已加载
                    handler.postDelayed(() -> {
                        WebView wv = getBridge().getWebView();
                        if (wv != null) {
                            SaveMigrator.injectSaves(wv, saves, MainActivity.this);
                            Toast.makeText(MainActivity.this,
                                "存档迁移完成！重新加载中...", Toast.LENGTH_LONG).show();
                        }
                    }, 2000);
                }

                @Override
                public void onMigrationSkipped(String reason) {
                    Log.d(TAG, "存档迁移跳过: " + reason);
                }
            });
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        handler.removeCallbacksAndMessages(null);
        // 清理迁移器资源
        if (migrator != null) {
            migrator.cleanup();
            migrator = null;
        }
    }

    private void dismissLoading() {
        if (loadingDismissed || loadingOverlay == null) return;
        loadingDismissed = true;
        // 只移除进入按钮的超时回调，不清除所有回调（避免误杀迁移注入回调）
        if (enterButtonRunnable != null) {
            handler.removeCallbacks(enterButtonRunnable);
        }
        loadingOverlay.animate()
            .alpha(0f)
            .setDuration(300)
            .withEndAction(() -> loadingOverlay.setVisibility(View.GONE))
            .start();
    }
}
