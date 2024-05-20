// @flow
import React, {
    forwardRef,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";
import styled from "styled-components";
import { DndProvider, useDrop } from "react-dnd";
import { NativeTypes, HTML5Backend } from "react-dnd-html5-backend";
import Uploady, {
    UploadyContext,
    useBatchAddListener,
    useBatchProgressListener,
    useBatchStartListener,
    useBatchFinishListener,
    useItemFinishListener,
    useItemStartListener,
} from "@rpldy/uploady";
import UploadButton, { asUploadButton } from "@rpldy/upload-button";
import UploadDropZone from "./src";
import {
    createUploadyStory,
    StoryUploadProgress,
    dropZoneCss,
    getCsfExport,
    type CsfExport,
    type UploadyStory,
} from "../../../story-helpers";
import readme from "./README.md";

import type { Node, Ref } from "react";
import type { UploadButtonProps } from "@rpldy/upload-button";
import type { GetFilesMethod } from "./src";

const StyledDropZone = styled(UploadDropZone)`
    ${dropZoneCss}
`;

const SmallDropZone = styled(StyledDropZone)`
    width: 200px;
    height: 200px;
`;

export const Simple: UploadyStory = createUploadyStory(
    ({ enhancer, destination, multiple, grouped, groupSize, extOptions }): Node => {
        return (
            <Uploady
                debug
                multiple={multiple}
                destination={destination}
                enhancer={enhancer}
                grouped={grouped}
                maxGroupSize={groupSize}
                {...extOptions}
            >
                <StyledDropZone id="upload-drop-zone" onDragOverClassName="drag-over">
                    <div id="drag-text">Drag File(s) Here</div>
                    <div id="drop-text">Drop File(s) Here</div>
                </StyledDropZone>
            </Uploady>
        );
    });

export const WithProgress: UploadyStory = createUploadyStory(
    ({ enhancer, destination, multiple, grouped, groupSize }): Node => {
        return (
            <Uploady
                debug
                multiple={multiple}
                destination={destination}
                enhancer={enhancer}
                grouped={grouped}
                maxGroupSize={groupSize}
            >
                <StyledDropZone onDragOverClassName="drag-over">
                    <div id="drag-text">Drag File(s) Here</div>
                    <div id="drop-text">Drop File(s) Here</div>

                    <StoryUploadProgress/>
                </StyledDropZone>
            </Uploady>
        );
    });

export const WithDropHandler: UploadyStory = createUploadyStory(
    ({ enhancer, destination, multiple, grouped, groupSize }): Node => {
        const dropHandler = useCallback((e: SyntheticDragEvent<HTMLDivElement>) => {
            console.log(">>>> DROP EVENT ", e.dataTransfer);
            return "https://i.pinimg.com/originals/51/bf/9c/51bf9c7fdf0d4303140c4949afd1d7b8.jpg";
        }, []);

        return (
            <Uploady
                debug
                multiple={multiple}
                destination={destination}
                enhancer={enhancer}
                grouped={grouped}
                maxGroupSize={groupSize}
            >
                <StyledDropZone
                    id="upload-drop-zone"
                    onDragOverClassName="drag-over"
                    dropHandler={dropHandler}
                >
                    <div id="drag-text">Drag File(s) Here</div>
                    <div id="drop-text">Drop Files(s) Here</div>
                </StyledDropZone>
            </Uploady>
        );
    });

export const WithDropHandlerAndGetFiles: UploadyStory = createUploadyStory(
    ({ enhancer, destination, multiple, grouped, groupSize, maxDropCount }): Node => {
        const dropHandler = useCallback(
            async (e: SyntheticMouseEvent<HTMLElement>, getFiles: GetFilesMethod) => {
                const files = await getFiles();
                return files.slice(0, maxDropCount);
            },
            [maxDropCount],
        );

        return (
            <Uploady
                debug
                multiple={multiple}
                destination={destination}
                enhancer={enhancer}
                grouped={grouped}
                maxGroupSize={groupSize}
            >
                <StyledDropZone
                    id="upload-drop-zone"
                    onDragOverClassName="drag-over"
                    dropHandler={dropHandler}
                >
                    <div id="drag-text">Drag File(s) Here</div>
                    <div id="drop-text">Drop Files(s) Here</div>
                </StyledDropZone>
            </Uploady>
        );
    }, {
        args: {
            maxDropCount: 1
        },
        argTypes: {
            maxDropCount: { control: "number" },
        }
    });

const DifferentWrapper = styled.div`
    display: flex;
    justify-content: space-around;
`;

export const DifferentConfiguration: UploadyStory = createUploadyStory(
    ({ enhancer, destination, multiple, grouped, groupSize }): Node => {
        const destinationOverride = useMemo(
            () => ({
                ...destination,
                headers: { ...destination.headers, "x-test": "1234" },
            }),
            [destination],
        );

        return (
            <Uploady
                debug
                multiple={multiple}
                destination={destination}
                enhancer={enhancer}
                grouped={grouped}
                maxGroupSize={groupSize}
            >
                <p>
                    DropZones can use different configuration overrides. However, Some
                    options cannot be overriden.
                    <br/>
                    For example, any prop that influence the file input directly (such as
                    multiple)
                </p>

                <DifferentWrapper>
                    <SmallDropZone
                        id="upload-dz-a"
                        onDragOverClassName="drag-over"
                        autoUpload={false}
                    >
                        <h2>autoUpload = false</h2>
                        <div id="drag-text">Drag File(s) Here</div>
                        <div id="drop-text">Drop Files(s) Here</div>
                    </SmallDropZone>

                    <SmallDropZone
                        id="upload-dz-b"
                        onDragOverClassName="drag-over"
                        destination={destinationOverride}
                    >
                        <h2>add 'x-test' header</h2>
                        <div id="drag-text">Drag File(s) Here</div>
                        <div id="drop-text">Drop Files(s) Here</div>
                    </SmallDropZone>
                </DifferentWrapper>

                <StoryUploadProgress/>
            </Uploady>
        );
    });

const ThirdPartyDropZone = styled.div`
    ${dropZoneCss}
`;

const ThirdPartyDropZoneContainer = ({ userData }: { userData: any }) => {
    const uploadyContext = useContext(UploadyContext);

    const [{ isDragging }, dropRef] = useDrop({
        accept: NativeTypes.FILE,
        collect: (monitor) => ({
            isDragging: !!monitor.isOver(),
        }),
        drop: (item, monitor) => {
            if (uploadyContext) {
                uploadyContext.upload(item.files, { userData });
            }
        },
    });

    return (
        <ThirdPartyDropZone
            id="upload-drop-zone"
            ref={dropRef}
            className={isDragging ? "drag-over" : ""}
        >
            <h2>Using React DnD</h2>
            <div id="drag-text">Drag File(s) Here</div>
            <div id="drop-text">Drop Files(s) Here</div>
        </ThirdPartyDropZone>
    );
};

type UserDataState = {
    itemStart: ?{ test: string },
    itemFinish: ?{ test: string },
    batchAdd: ?{ test: string },
    batchStart: ?{ test: string },
    batchProgress: ?{ test: string },
    batchFinish: ?{ test: string },
};

const UserDataRenderer = () => {
    const [userData, setUserData] = useState<UserDataState>({
        itemStart: null,
        itemFinish: null,
        batchAdd: null,
        batchStart: null,
        batchProgress: null,
        batchFinish: null,
    });

    useItemStartListener((item, options) => {
        setUserData((data: UserDataState) => ({
            ...data,
            itemStart: options.userData,
        }));
    });

    useItemFinishListener((item, options) => {
        setUserData((data: UserDataState) => ({
            ...data,
            itemFinish: options.userData,
        }));
    });

    useBatchAddListener((batch, options) => {
        setUserData((data: UserDataState) => ({
            ...data,
            batchAdd: options.userData,
        }));
    });

    useBatchStartListener((batch, options) => {
        setUserData((data) => ({ ...data, batchStart: options.userData }));
    });

    useBatchProgressListener((batch, options) => {
        setUserData((data) => ({ ...data, batchProgress: options.userData }));
    });

    useBatchFinishListener((batch, options) => {
        setUserData((data) => ({ ...data, batchFinish: options.userData }));
    });

    return (
        <ul id="user-data-results">
            {Object.entries(userData).map(([key, val]) => {
                //$FlowExpectedError[incompatible-use] flow and entries...
                return val ? (<li key={key} data-id={key}>{key}: {val.test}</li>) : null;
            })}
        </ul>
    );
};

export const WithThirdPartyDropZone: UploadyStory = createUploadyStory(
    ({ enhancer, destination, multiple, grouped, groupSize, extOptions }): Node => {
        const overrideUserData = extOptions?.userData;

        return (
            <DndProvider backend={HTML5Backend}>
                <Uploady
                    debug
                    multiple={multiple}
                    destination={destination}
                    enhancer={enhancer}
                    grouped={grouped}
                    maxGroupSize={groupSize}
                >
                    <ThirdPartyDropZoneContainer userData={overrideUserData}/>
                    {overrideUserData && <UserDataRenderer/>}
                </Uploady>
            </DndProvider>
        );
    });

const MyClickableDropZone = forwardRef(
    (props: UploadButtonProps, ref: Ref<"div">) => {
        const { onClick, ...buttonProps } = props;

        const onZoneClick = useCallback(
            (e: SyntheticMouseEvent<HTMLElement>) => {
                if (onClick) {
                    onClick(e);
                }
            },
            [onClick],
        );

        return (
            <StyledDropZone
                {...buttonProps}
                ref={ref}
                onDragOverClassName="drag-over"
                extraProps={{ onClick: onZoneClick }}
            >
                <div id="drag-text">Drag File(s) Here</div>
                <div id="drop-text">Drop File(s) Here</div>
            </StyledDropZone>
        );
    },
);

const DropZoneButton = asUploadButton(MyClickableDropZone);

export const WithAsUploadButton: UploadyStory = createUploadyStory(
    ({ enhancer, destination, multiple, grouped, groupSize }): Node => {

        return (
            <Uploady
                debug
                multiple={multiple}
                destination={destination}
                enhancer={enhancer}
                grouped={grouped}
                maxGroupSize={groupSize}
            >
                <p>Drop zone and upload button in a single component!</p>

                <DropZoneButton/>
            </Uploady>
        );
    });

const StyledFullScreenDropZone = styled(UploadDropZone)`
    width: 100%;
    height: 100vh;

    .content {
        width: 100%;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        position: relative;
        flex-wrap: wrap;

        h1 {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        .content-box {
            flex-grow: 1;
            height: 100%;
        }
    }

    &.drag-over .dropIndicator {
        position: absolute;
        z-index: 2;
        background: rgba(0, 0, 0, 0.5);
        border: 8px solid green;
        inset: 0;
    }
`;

export const WithFullScreen: UploadyStory = createUploadyStory(
    ({ enhancer, destination, multiple, grouped, groupSize, extOptions }): Node => {
        const indicatorRef = useRef<null | HTMLDivElement>(null);

        return (
            <Uploady
                debug
                multiple={multiple}
                destination={destination}
                enhancer={enhancer}
                grouped={grouped}
                maxGroupSize={groupSize}
                {...extOptions}
            >
                <StyledFullScreenDropZone
                    // enableOnContains={false}
                    id="upload-drop-zone"
                    onDragOverClassName="drag-over"
                    shouldRemoveDragOver={({ target }) => target === indicatorRef.current}
                    shouldHandleDrag={(e) => {
                        const allFiles =
                            e.dataTransfer?.items?.length &&
                            //$FlowExpectedError[method-unbinding]
                            Array.prototype.slice
                                .call(e.dataTransfer.items)
                                .every((item) => item.kind === "file");
                        console.log("----- shouldHandleDrag -> All Files", allFiles, e);
                        return allFiles;
                    }}
                >
                    <div className="content">
                        {[
                            { color: "#f19898", title: "A" },
                            { color: "#143b15", title: "B" },
                            { color: "#27569b", title: "C" },
                            { color: "#f1d898", title: "D" },
                            { color: "#9b1a63", title: "E" },
                            { color: "#42eee8", title: "F" },
                        ].map(({ color, title }) => (
                            <div
                                key={title}
                                className="content-box"
                                style={{ backgroundColor: color }}
                            >
                                {title}
                            </div>
                        ))}

                        <h1>Drop files here</h1>
                    </div>
                    <div className="dropIndicator" aria-hidden ref={indicatorRef}/>
                </StyledFullScreenDropZone>
            </Uploady>
        );
    });

export const WithDndTurnedOff: UploadyStory = createUploadyStory(
    ({ enhancer, destination, extOptions }): Node => {
        return (
            <Uploady
                debug
                destination={destination}
                enhancer={enhancer}
                {...extOptions}
            >
                <StyledDropZone
                    id="upload-drop-zone"
                    onDragOverClassName="drag-over"
                    shouldHandleDrag={false}
                >
                    <div id="drag-text">Drag File(s) Here</div>
                    <div id="drop-text">Drop File(s) Here</div>
                </StyledDropZone>
            </Uploady>
        );
    });

const StyledDropZoneWithButton = styled(StyledDropZone)`
    &.drag-over {
        button {
            display: none;
        }
    }
`;

export const WithUploadButtonInside: UploadyStory = createUploadyStory(
    ({ enhancer, destination, extOptions }): Node => {
        return (
            <Uploady
                debug
                destination={destination}
                enhancer={enhancer}
                {...extOptions}
            >
                <StyledDropZoneWithButton
                    id="upload-drop-zone"
                    onDragOverClassName="drag-over"
                >
                    <UploadButton/>
                </StyledDropZoneWithButton>
            </Uploady>
        );
    });

const InsideContainer = styled.div`
    width: 150px;
    height: 80px;
    background-color: #0074d9;
`;

export const WithChildElement: UploadyStory = createUploadyStory(
    ({ enhancer, destination, extOptions }): Node => {
        return (
            <Uploady
                debug
                destination={destination}
                enhancer={enhancer}
                {...extOptions}
            >
                <StyledDropZone id="upload-drop-zone" onDragOverClassName="drag-over">
                    <InsideContainer id="dnd-child"/>
                </StyledDropZone>
            </Uploady>
        );
    });

const dropzoneStories: CsfExport = getCsfExport(UploadDropZone, "Upload Drop Zone", readme, {
    pkg: "upload-drop-zone",
    section: "UI",
    // args: {
    //     maxDropCount: 1
    // },
    // argTypes: {
    //     maxDropCount: { control: "number" },
    // }
});

export default { ...dropzoneStories, title: "UI/Upload Drop Zone" };
