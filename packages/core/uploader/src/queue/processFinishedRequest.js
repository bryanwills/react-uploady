// @flow
import { FILE_STATES, logger } from "@rpldy/shared";
import { UPLOADER_EVENTS, ITEM_FINALIZE_STATES } from "../consts";
import { cleanUpFinishedBatches, incrementBatchFinishedCounter, getBatchDataFromItemId } from "./batchHelpers";
import { finalizeItem } from "./itemHelpers";

import type { UploadData, BatchItem } from "@rpldy/shared";
import type { ProcessNextMethod, QueueState } from "./types";

type FileStateToEventMap = {
    [string]: ?string,
};

export const FILE_STATE_TO_EVENT_MAP: FileStateToEventMap = {
    [FILE_STATES.PENDING.valueOf()]: null,
    [FILE_STATES.ADDED.valueOf()]: UPLOADER_EVENTS.ITEM_START,
    [FILE_STATES.FINISHED.valueOf()]: UPLOADER_EVENTS.ITEM_FINISH,
    [FILE_STATES.ERROR.valueOf()]: UPLOADER_EVENTS.ITEM_ERROR,
    [FILE_STATES.CANCELLED.valueOf()]: UPLOADER_EVENTS.ITEM_CANCEL,
    [FILE_STATES.ABORTED.valueOf()]: UPLOADER_EVENTS.ITEM_ABORT,
    [FILE_STATES.UPLOADING.valueOf()]: UPLOADER_EVENTS.ITEM_PROGRESS,
};

type FinishData = { id: string, info: UploadData };

const getIsFinalized = (item: BatchItem) =>
	!!~ITEM_FINALIZE_STATES.indexOf(item.state);

const processFinishedRequest = (queue: QueueState, finishedData: FinishData[], next: ProcessNextMethod): void => {
    finishedData.forEach((itemData: FinishData) => {
        const state = queue.getState();
        const { id, info } = itemData;

        logger.debugLog("uploader.processor.queue: request finished for item - ", { id, info });

        if (state.items[id]) {
            queue.updateState((state) => {
                const item = state.items[id];
                item.state = info.state;
                item.uploadResponse = info.response;
                item.uploadStatus = info.status;

                if (getIsFinalized(item)) {
                    delete state.aborts[id];
                }
            });

            //get most up-to-date item data
            const item = queue.getState().items[id];

            if (info.state === FILE_STATES.FINISHED && item.completed < 100) {
                //ensure we trigger progress event with completed = 100 for all items
                const size = item.file?.size || 0;
                queue.handleItemProgress(item, 100, size , size);
            }

            const { itemBatchOptions } = getBatchDataFromItemId(queue, id);
            const batchOptions = itemBatchOptions[id];

            const itemState = item.state.valueOf();
            if (FILE_STATE_TO_EVENT_MAP[itemState]) {
                //trigger UPLOADER EVENT for item based on its state
                queue.trigger(FILE_STATE_TO_EVENT_MAP[itemState], item, batchOptions);
            }

            if (getIsFinalized(item)) {
                incrementBatchFinishedCounter(queue, item.batchId);
                //trigger FINALIZE event
                queue.trigger(UPLOADER_EVENTS.ITEM_FINALIZE, item, batchOptions);
            }
        }

        finalizeItem(queue, id);
    });

    //ensure finished batches are removed from state
    cleanUpFinishedBatches(queue);

    next(queue);
};

export default processFinishedRequest;
