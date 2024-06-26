import { __awaiter, __decorate, __metadata } from "tslib";
import { lensRepositoryFactory } from "./lens/LensRepository";
import { CONTAINER } from "./dependency-injection/Container";
import { Injectable } from "./dependency-injection/Injectable";
import { cameraKitSessionFactory } from "./session/CameraKitSession";
import { registerLensAssetsProvider } from "./lens/assets/LensAssetsProvider";
import { lensCoreFactory } from "./lens-core-module/loader/lensCoreFactory";
import { configurationToken } from "./configuration";
import { registerUriHandlers } from "./extensions/uriHandlersRegister";
import { metricsEventTargetFactory } from "./metrics/metricsEventTarget";
import { reportSessionScopedMetrics } from "./metrics/reporters/reporters";
import { lensStateFactory } from "./session/lensState";
import { lensKeyboardFactory } from "./session/LensKeyboard";
import { registerLensClientInterfaceHandler } from "./lens-client-interface/lensClientInterface";
import { sessionStateFactory } from "./session/sessionState";
import { lensExecutionError, lensAbortError } from "./namedErrors";
import { getLogger, resetLogger } from "./logger/logger";
import { errorLoggingDecorator } from "./logger/errorLoggingDecorator";
import { TypedEventTarget } from "./events/TypedEventTarget";
import { pageVisibilityFactory } from "./common/pageVisibility";
import { setPreloadedConfiguration } from "./remote-configuration/preloadConfiguration";
const logger = getLogger("CameraKit");
const log = errorLoggingDecorator(logger);
/**
 * Metrics event names that are exposed to apps.
 */
const publicMetricsEventNames = ["lensView", "lensWait"];
/**
 * The entry point to the CameraKit SDK's API. Most of CameraKit's features are accessed via this class.
 *
 * Applications obtain an instance of CameraKit by calling {@link bootstrapCameraKit}.
 *
 * @example
 * ```ts
 * const cameraKit = await bootstrapCameraKit(config)
 * ```
 *
 * Then this class can be used to:
 * - Create a {@link CameraKitSession} instance, which provides the API for setting up media inputs, applying Lenses,
 * and obtaining rendered `<canvas>` outputs.
 * - Query for lenses using {@link LensRepository}.
 * - Listen for lens usage metrics events using {@link MetricsEventTarget}.
 *
 * @category Rendering
 * @category Lenses
 */
export class CameraKit {
    /** @internal */
    constructor(
    /**
     * Used to query for lenses and lens groups.
     */
    lensRepository, lensCore, pageVisibility, container, allMetrics) {
        this.lensRepository = lensRepository;
        this.lensCore = lensCore;
        this.pageVisibility = pageVisibility;
        this.container = container;
        /**
         * Business metrics (e.g. each time a lens is viewed) are emitted here.
         */
        this.metrics = new TypedEventTarget();
        this.sessions = [];
        this.lenses = { repository: this.lensRepository };
        // Proxy only a subset of all metrics events to the public-facing emitter -- applications don't need to
        // know about most events.
        publicMetricsEventNames.forEach((eventName) => {
            allMetrics.addEventListener(eventName, (e) => this.metrics.dispatchEvent(e));
        });
    }
    /**
     * Create a CameraKitSession.
     *
     * This initializes the rendering engine and returns a {@link CameraKitSession} instance, which provides access
     * to Lens rendering.
     *
     * @example
     * ```ts
     * const cameraKit = await bootstrapCameraKit(config)
     * const session = await cameraKit.createSession()
     *
     * const lens = await cameraKit.lensRepository.loadLens(lensId, groupId)
     * session.applyLens(lens)
     * ```
     *
     * @param options
     */
    createSession({ liveRenderTarget, renderWhileTabHidden, } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // Any error happened during lens rendering can be processed by subscribing to sessionErrors
            const exceptionHandler = (error) => {
                if (error.name === "LensCoreAbortError") {
                    logger.error(lensAbortError("Unrecoverable error occurred during lens execution. " +
                        "The CameraKitSession will be destroyed.", error));
                }
                else {
                    logger.error(lensExecutionError("Error occurred during lens execution. " +
                        "The lens cannot be rendered and will be removed from the CameraKitSession.", error));
                }
            };
            /**
             * If/when we add support for multiple concurrent sessions, we'll need to create a copy of the LensCore WASM
             * module. If we move managing web workers into JS, spawning a new worker thread with its own copy of LensCore
             * probably becomes a lot more straightforward.
             *
             * Currently chromium has a bug preventing rendering while tab is hidden when LensCore is in worker mode.
             * In order to process tab while it is hidden, the current stopgap is to pass in renderWhileTabHidden as true,
             * which will initiate session in non worker mode, and set the RenderLoopMode to `SetTimeout`.
             */
            yield this.lensCore.initialize({
                canvas: liveRenderTarget,
                shouldUseWorker: !renderWhileTabHidden && this.container.get(configurationToken).shouldUseWorker,
                exceptionHandler,
            });
            yield this.lensCore.setRenderLoopMode({
                mode: renderWhileTabHidden
                    ? this.lensCore.RenderLoopMode.SetTimeout
                    : this.lensCore.RenderLoopMode.RequestAnimationFrame,
            });
            // Each session gets its own DI Container – some Services provided by this Container may be shared with the
            // root CameraKit Container, but others may be scoped to the session by passing their token to `copy()`.
            const sessionContainer = this.container
                // Right now this is a no-op. If/when we add support for multiple concurrent sessions, we may end up
                // scoping LensCore to the session.
                .copy()
                .provides(sessionStateFactory)
                .provides(lensStateFactory)
                .provides(lensKeyboardFactory)
                .provides(cameraKitSessionFactory)
                .run(registerLensAssetsProvider)
                .run(registerLensClientInterfaceHandler)
                .run(setPreloadedConfiguration)
                // We'll run a PartialContainer containing reporters for session-scoped metrics. Running this container
                // allows each metric reporter to initialize itself (e.g. by adding event listeners to detect when certain
                // actions occur).
                .run(reportSessionScopedMetrics)
                // UriHandlers may have dependencies on session-scoped services (e.g. LensState, LensKeyboard), so they'll
                // be registered with LensCore here.
                .run(registerUriHandlers);
            const session = sessionContainer.get(cameraKitSessionFactory.token);
            this.sessions.push(session);
            return session;
        });
    }
    /**
     * Destroys all sessions and frees all resources.
     */
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            resetLogger();
            this.pageVisibility.destroy();
            yield Promise.all(this.sessions.map((session) => session.destroy()));
            this.sessions = [];
        });
    }
}
__decorate([
    log,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CameraKit.prototype, "createSession", null);
__decorate([
    log,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CameraKit.prototype, "destroy", null);
/** @internal */
export const cameraKitFactory = Injectable("CameraKit", [
    lensRepositoryFactory.token,
    metricsEventTargetFactory.token,
    lensCoreFactory.token,
    pageVisibilityFactory.token,
    CONTAINER,
], (lensRepository, metrics, lensCore, pageVisibility, container) => new CameraKit(lensRepository, lensCore, pageVisibility, container, metrics));
//# sourceMappingURL=CameraKit.js.map
