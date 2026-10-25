package com.alexgalhardo.trucoroguelite;

import android.os.Bundle;
import android.view.WindowManager;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // Android back = Esc in the game (pause in a run, back in menus) instead of closing the app.
    // keyCode is set too: Phaser matches keys by keyCode, the rebindable hotkeys by code.
    private static final String ESCAPE =
        "['keydown','keyup'].forEach(function(t){window.dispatchEvent(new KeyboardEvent(t,"
            + "{key:'Escape',code:'Escape',keyCode:27,which:27,bubbles:true}))})";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // The screen stays on while the game is open (a run is played hands-off at times, MOB4.3).
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                getBridge().getWebView().evaluateJavascript(ESCAPE, null);
            }
        });
    }

    // Going to the background (home, a call, another app): the WebView keeps document.hidden
    // false, so the page is told what a browser tab would see. Phaser then pauses its loop and
    // emits 'pause' (the table opens its pause menu, MOB4.1) and the blur suspends the audio;
    // coming back restores the real getter and focus, and the audio resumes.
    private static final String HIDE =
        "Object.defineProperty(document,'hidden',{configurable:true,get:function(){return true}});"
            + "document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('blur'))";
    private static final String SHOW =
        "delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));"
            + "window.dispatchEvent(new Event('focus'))";

    @Override
    public void onPause() {
        getBridge().getWebView().evaluateJavascript(HIDE, null);
        super.onPause();
    }

    @Override
    public void onResume() {
        super.onResume();
        getBridge().getWebView().evaluateJavascript(SHOW, null);
    }

    // Immersive full screen: status and navigation bars come back with a swipe, then hide again.
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus) return;
        WindowInsetsControllerCompat bars =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        bars.hide(WindowInsetsCompat.Type.systemBars());
        bars.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
