import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft as ArrowLeftIcon,
  Circle as CircleIcon,
  Microphone as MicIcon,
  FloppyDisk as SaveIcon,
  Stop as StopIcon,
} from '@phosphor-icons/react';
import { useMachine } from '@xstate/react';

import { useAuth } from '@/context/auth-provider';
import { useDeviceState } from '@/context/device-provider';
import { TEXT_MIME_TYPE, WAV_MIME_TYPE } from '@/lib/audio';
import {
  REC_EXTENSION,
  REC_PREFIX,
  SupportedLanguage,
  TRANSCRIPT_EXTENSION,
  TRANSCRIPT_PREFIX,
} from '@/lib/constant';
import { supabase } from '@/lib/supabase';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

import { DeviceSelect } from './components/device-select';
import { LanguageSelect } from './components/language-select';
import LiveBadge from './components/live-badge';
import { recorderMachine, type RecorderEventType } from './recorder-machine';

const CACHE_CONTROL = '86400'; // 1 day

type RecorderActionsType = {
  [K in RecorderEventType['type']]: () => void;
};

type FileUploadState = {
  isUploading: boolean;
  hasError: boolean;
  message: string | null;
};

export default function _Root() {
  const navigate = useNavigate();

  return (
    <div className="mb-10 py-5">
      <Button onClick={() => navigate('/')} variant="outline">
        <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>
      <RecorderView />
    </div>
  );
}

function RecorderView() {
  const [fileUploadState, setFileUploadState] = useState<FileUploadState>({
    isUploading: false,
    hasError: false,
    message: null,
  });
  const [language, setLanguage] = useState<SupportedLanguage>('en-US');

  // Get the active device from the device context
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeDevice, hasActiveDevice } = useDeviceState();
  const speechToText = useSpeechToText({
    deviceId: activeDevice,
    language,
  });

  const audioElRef = useRef<HTMLAudioElement>(null);

  // Create a new instance of the state machine
  const [current, send] = useMachine(recorderMachine);
  const { value: recordingState } = current;

  const isTranscribing = useMemo(() => {
    return speechToText.liveStatus && recordingState === 'recording';
  }, [recordingState, speechToText.liveStatus]);

  const selectedDevice = useMemo(() => {
    if (!activeDevice?.length) return undefined;
    return hasActiveDevice(activeDevice) ? activeDevice : undefined;
  }, [activeDevice, hasActiveDevice]);

  const uploadFile = async () => {
    const playbackBlob = speechToText.getPlaybackBlob();
    const transcriptBlob = speechToText.getTranscriptBlob();

    console.log(playbackBlob, transcriptBlob);

    if (!playbackBlob?.size) {
      throw new Error(
        'Recording or transcript is corrupted. Unable to fetch blobs',
      );
    }

    setFileUploadState({
      isUploading: true,
      hasError: false,
      message: null,
    });

    const now = Date.now();
    const audioUploadPromise = supabase.storage
      .from('recording')
      .upload(`${user?.id}/${REC_PREFIX}${now}${REC_EXTENSION}`, playbackBlob, {
        upsert: true,
        cacheControl: CACHE_CONTROL,
        contentType: WAV_MIME_TYPE,
      });

    const transcriptUploadPromise = transcriptBlob?.size
      ? supabase.storage
          .from('recording')
          .upload(
            `${user?.id}/${TRANSCRIPT_PREFIX}${now}${TRANSCRIPT_EXTENSION}`,
            transcriptBlob,
            {
              upsert: true,
              cacheControl: CACHE_CONTROL,
              contentType: TEXT_MIME_TYPE,
            },
          )
      : Promise.resolve();

    const [{ error }] = await Promise.all([
      audioUploadPromise,
      transcriptUploadPromise,
    ]);

    if (error) {
      console.log(error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem while uploading the file.',
        action: (
          <ToastAction altText="Try again" onClick={uploadFile}>
            Try again
          </ToastAction>
        ),
      });
      return;
    }

    toast({
      title: 'Sweet!',
      description: 'Your recording has been saved successfully.',
    });

    setFileUploadState({
      isUploading: false,
      hasError: !!error,
      message: error,
    });
  };

  const recorderActions: RecorderActionsType = {
    RECORD: () => {
      speechToText.start();
    },
    STOP: () => {
      speechToText.stop();
    },
    START: () => {
      speechToText.destroy();
      speechToText.start();
    },
    SAVE: async () => {
      await uploadFile();
    },
  };

  const handleRecorderAction = (action: RecorderEventType['type']) => {
    send({ type: action });
    recorderActions[action]?.();
  };

  return (
    <div className="flex h-[550px] w-full justify-center">
      <div className="mt-5 w-full rounded-md border p-2">
        <div className="flex items-start justify-between">
          <div className="w-4/12">
            <DeviceSelect disabled={isTranscribing} />
            <div className="mt-2" />
            <LiveBadge isLive={isTranscribing} />
          </div>
          <div className="w-2/12 [&>*:nth-child(2)]:w-1/2">
            <LanguageSelect
              disabled={isTranscribing}
              language={language}
              setLanguage={setLanguage}
            />
          </div>
        </div>

        {selectedDevice ? (
          <>
            <div className="flex h-[200px] w-full items-center justify-center">
              {speechToText.playBackURL ? (
                <audio
                  ref={audioElRef}
                  src={speechToText.playBackURL}
                  controls
                />
              ) : (
                <canvas
                  width={500}
                  height={200}
                  ref={speechToText.visualizerCanvasRef}
                  id="canvas"
                />
              )}
            </div>
            <div className="flex items-center justify-center">
              {recordingState === 'idle' && (
                <Button onClick={() => handleRecorderAction('RECORD')}>
                  <MicIcon className="mr-2 h-4 w-4" />
                  Start Recording
                </Button>
              )}
              {recordingState === 'recording' && (
                <Button onClick={() => handleRecorderAction('STOP')}>
                  <StopIcon className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              )}
              {recordingState === 'stopped' && (
                <>
                  <Button onClick={() => handleRecorderAction('START')}>
                    <MicIcon className="mr-2 h-4 w-4" />
                    Start New Recording
                  </Button>
                  <Button
                    variant="outline"
                    className="ml-3"
                    onClick={() => handleRecorderAction('SAVE')}
                    disabled={fileUploadState.isUploading}
                  >
                    {fileUploadState.isUploading ? (
                      <CircleIcon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <SaveIcon className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </>
              )}
            </div>
          </>
        ) : (
          <p className="mt-20 text-center">
            Please allow Microphone access and select the input device to start
            recording
          </p>
        )}

        <div className="mt-5 flex justify-center">
          {isTranscribing && !speechToText.transcript && (
            <div className="w-1/2">
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          )}
          {speechToText.transcript && (
            <p className="line-clamp-8 w-1/2 bg-muted text-left text-sm">
              {speechToText.transcript}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
