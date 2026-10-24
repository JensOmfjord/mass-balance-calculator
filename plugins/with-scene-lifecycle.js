const { withInfoPlist, withPodfile } = require('expo/config-plugins');
const { withBuildSourceFile } = require('@expo/config-plugins/build/ios/XcodeProjectFile');

const MINIMUM_IOS_VERSION = '15.1';

/**
 * Adopts the UIKit scene-based life cycle.
 *
 * Starting with the iOS 27 SDK, UIKit requires apps to adopt the scene-based
 * life cycle or they fail to launch with:
 *
 *   Application failed to launch: UIScene life cycle is required for apps
 *   built with this SDK. See Technote TN3187 for more information.
 *
 * The bare Expo template for SDK 54-57 does not ship a SceneDelegate, so the
 * app is terminated by UIKit at startup (EXC_BREAKPOINT in
 * _UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption).
 *
 * The SceneDelegate below attaches the window that `AppDelegate` already
 * created to the connecting UIWindowScene, so the existing React Native
 * startup path in AppDelegate keeps working unchanged.
 */
const SCENE_DELEGATE_SOURCE = `import UIKit

@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let appWindow = appDelegate.window
    else { return }

    appWindow.windowScene = windowScene
    window = appWindow
    window?.makeKeyAndVisible()
  }
}
`;

/**
 * Raises the deployment target of every pod target to the app's minimum.
 *
 * Xcode 27 refuses to build a target whose IPHONEOS_DEPLOYMENT_TARGET is
 * below 15.0. React Native's `updateOSDeploymentTarget` only walks
 * `pod_target_installation_results`, which misses subspec targets such as
 * `RNSVG-RNSVGFilters` (iOS 12.4) and
 * `RNCAsyncStorage-RNCAsyncStorage_resources` (iOS 13.4) - those keep the
 * target declared in their podspec and fail the build.
 */
const POD_DEPLOYMENT_TARGET_PATCH = `    # Xcode 27 rejects pod targets below iOS ${MINIMUM_IOS_VERSION}.
    # React Native only raises top-level pod targets, so subspec targets keep
    # the lower target declared in their podspec.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < ${MINIMUM_IOS_VERSION}
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MINIMUM_IOS_VERSION}'
        end
      end
    end
`;

const PODFILE_MARKER = 'Xcode 27 rejects pod targets below iOS';
const REACT_NATIVE_POST_INSTALL_CALL = /react_native_post_install\((?:[^()]|\([^()]*\))*\)/;

const withSceneLifecycle = (config) => {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

  config = withBuildSourceFile(config, {
    filePath: 'SceneDelegate.swift',
    contents: SCENE_DELEGATE_SOURCE,
    overwrite: true,
  });

  config = withPodfile(config, (cfg) => {
    const contents = cfg.modResults.contents;
    if (contents.includes(PODFILE_MARKER)) {
      return cfg;
    }

    // CocoaPods keeps a single post_install callback, so the patch has to be
    // injected into the existing hook rather than appended as a second one.
    const match = contents.match(REACT_NATIVE_POST_INSTALL_CALL);
    if (!match) {
      throw new Error(
        'with-scene-lifecycle: could not find the react_native_post_install call in the Podfile.'
      );
    }

    const insertAt = match.index + match[0].length;
    cfg.modResults.contents =
      contents.slice(0, insertAt) + '\n\n' + POD_DEPLOYMENT_TARGET_PATCH + contents.slice(insertAt);
    return cfg;
  });

  return config;
};

module.exports = withSceneLifecycle;
