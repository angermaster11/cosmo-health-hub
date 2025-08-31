// VideoCall.tsx (fixed)

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Phone, PhoneOff, Video, VideoOff, Mic, MicOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function VideoCall() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { callCode } = useParams();

  const [callId, setCallId] = useState<string>(callCode || '');
  const [isInCall, setIsInCall] = useState(false);
  const [isCallCreator, setIsCallCreator] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const API_BASE = (import.meta.env.VITE_API_URL as string) || '';

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  // WebSocket setup AFTER callId+isInCall
  useEffect(() => {
    const setup = async () => {
      if (isInCall && callId) {
        connectWebSocket();
        try {
          await waitForWsOpen();
          await createPeerConnection();
          if (isCallCreator) {
            const offer = await peerConnection.current!.createOffer();
            await peerConnection.current!.setLocalDescription(offer);
            ws.current?.send(JSON.stringify({ type: 'offer', offer, call_id: callId }));
          }
        } catch (err) {
          console.error('Failed WS setup:', err);
          toast.error('Failed to connect. Try again.');
        }
      }
    };
    setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInCall, callId]);

  const connectWebSocket = () => {
    if (!callId) {
      console.error('Cannot connect WS: missing callId');
      return;
    }
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let hostPart = '';
    if (API_BASE) {
      hostPart = API_BASE.replace(/^https?:\/\//, '').replace(/\/$/, '');
    } else {
      hostPart = window.location.host;
    }

    const wsUrl = `${protocol}//${hostPart}/api/video-call/ws/${encodeURIComponent(callId)}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log('WebSocket connection established');

    ws.current.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'offer') {
          if (!peerConnection.current) await createPeerConnection();
          await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(message.offer));
          const answer = await peerConnection.current?.createAnswer();
          await peerConnection.current?.setLocalDescription(answer);

          ws.current?.send(JSON.stringify({ type: 'answer', answer, call_id: callId }));
        } else if (message.type === 'answer') {
          if (message.answer) {
            await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(message.answer));
          }
        } else if (message.type === 'ice-candidate') {
          if (message.candidate) {
            try {
              await peerConnection.current?.addIceCandidate(new RTCIceCandidate(message.candidate));
            } catch (err) {
              console.warn('Failed to add ICE candidate', err);
            }
          }
        } else if (message.type === 'call_ended') {
          toast.info('The call has ended');
          leaveCall();
        } else if (message.type === 'participant_left') {
          toast.info('The other participant has left the call');
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error. Please try again.');
    };

    ws.current.onclose = () => console.log('WebSocket connection closed');
  };

  const createPeerConnection = async () => {
    if (peerConnection.current) return;

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    peerConnection.current = new RTCPeerConnection(configuration);

    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, localStream);
      });
    }

    peerConnection.current.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const remoteMediaStream = new MediaStream();
        event.track && remoteMediaStream.addTrack(event.track);
        setRemoteStream(remoteMediaStream);
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        ws.current?.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate, call_id: callId }));
      }
    };

    peerConnection.current.onnegotiationneeded = async () => {
  try {
    if (isCallCreator) return;
    const offer = await peerConnection.current!.createOffer();
    await peerConnection.current!.setLocalDescription(offer);
    ws.current?.send(JSON.stringify({ type: "offer", offer, call_id: callId }));
  } catch (err) {
    console.error("Negotiation error:", err);
  }
};


    peerConnection.current.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.current?.connectionState);
      if (peerConnection.current?.connectionState === 'connected') {
        toast.success('Connected to other participant');
      }
    };
  };

  const waitForWsOpen = () =>
    new Promise<void>((resolve, reject) => {
      const max = 5000;
      const interval = 50;
      let waited = 0;
      const check = () => {
        if (!ws.current) return reject(new Error('WebSocket not initialized'));
        if (ws.current.readyState === WebSocket.OPEN) return resolve();
        if (ws.current.readyState === WebSocket.CLOSED || ws.current.readyState === WebSocket.CLOSING) {
          return reject(new Error('WebSocket closed'));
        }
        waited += interval;
        if (waited >= max) return reject(new Error('WebSocket open timeout'));
        setTimeout(check, interval);
      };
      check();
    });

const getLocalMedia = async () => {
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);

    // ✅ also add tracks to peerConnection if it already exists
    if (peerConnection.current) {
      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });
    }
  } catch (err: any) {
    if (err.name === 'NotReadableError' || err.name === 'NotAllowedError') {
      toast.warning('Camera/microphone not available. Joining without local media.');
      setLocalStream(null);
    } else throw err;
  }
  return stream;
};


  const createCall = async () => {
    if (!user) return toast.error('Sign in to create a call');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/video-call/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, user_name: user.user_metadata?.full_name || user.email }),
      });
      if (!res.ok) throw new Error('Failed to create call');
      const data = await res.json();
      await getLocalMedia();
      setCallId(data.call_id);
      setIsInCall(true);
      setIsCallCreator(true);
      toast.success('Call created, you are inside the call.');
    } catch (error: any) {
      console.error('Error creating call:', error);
      toast.error(error?.message || 'Failed to create call.');
      leaveCall();
    } finally {
      setIsLoading(false);
    }
  };

  const joinCall = async () => {
    if (!callId) return toast.error('Please enter a call code');
    if (!user) return toast.error('Sign in to join a call');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/video-call/join/${callId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, user_name: user.user_metadata?.full_name || user.email }),
      });
      if (!res.ok) throw new Error('Failed to join call');
      await getLocalMedia();
      setIsInCall(true);
      toast.success('Joined call successfully');
    } catch (error: any) {
      console.error('Error joining call:', error);
      toast.error(error?.message || 'Failed to join call.');
      leaveCall();
    } finally {
      setIsLoading(false);
    }
  };

  const leaveCall = () => {
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({ type: 'leave', call_id: callId }));
      } catch {}
      ws.current.close();
      ws.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsInCall(false);
    if (isCallCreator && callId) fetch(`${API_BASE}/api/video-call/end/${callId}`, { method: 'POST' }).catch(console.error);
    setIsCallCreator(false);
    toast.info('You left the call');
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const copyCallId = () => {
    navigator.clipboard.writeText(callId);
    toast.success('Call code copied');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
        </Button>
        <h1 className="text-3xl font-bold mb-6">Video Consultation</h1>

        {!isInCall ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Call</CardTitle>
                <CardDescription>Start a new video consultation and share the code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={createCall} className="w-full gap-2" disabled={isLoading}>
                  <Phone className="h-4 w-4" /> {isLoading ? 'Creating...' : 'Create New Call'}
                </Button>
                {callId && (
                  <div className="pt-4 border-t">
                    <Label htmlFor="callCode">Call Code</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input id="callCode" value={callId} readOnly className="font-mono" />
                      <Button variant="outline" size="icon" onClick={copyCallId}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Join Existing Call</CardTitle>
                <CardDescription>Enter the call code to join</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label htmlFor="joinCallCode">Call Code</Label>
                <Input id="joinCallCode" value={callId} onChange={(e) => setCallId(e.target.value.toUpperCase())} placeholder="Enter code" className="uppercase" />
                <Button onClick={joinCall} className="w-full gap-2" disabled={isLoading || !callId}>
                  <Phone className="h-4 w-4" /> {isLoading ? 'Joining...' : 'Join Call'}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Call Code</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-mono font-bold">{callId}</p>
                    <Button variant="ghost" size="icon" onClick={copyCallId}><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-xl font-bold">{remoteStream ? 'Connected' : 'Waiting...'}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-lg">You</CardTitle></CardHeader>
                <CardContent><video ref={localVideoRef} autoPlay muted playsInline className="w-full h-64 bg-black rounded-lg" /></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-lg">{remoteStream ? 'Other Participant' : 'Waiting...'}</CardTitle></CardHeader>
                <CardContent><video ref={remoteVideoRef} autoPlay playsInline className="w-full h-64 bg-black rounded-lg" /></CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6 flex justify-center space-x-4">
                <Button size="lg" variant={isVideoEnabled ? "default" : "secondary"} onClick={toggleVideo}>
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                <Button size="lg" variant={isAudioEnabled ? "default" : "secondary"} onClick={toggleAudio}>
                  {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button size="lg" variant="destructive" onClick={leaveCall} className="gap-2">
                  <PhoneOff className="h-5 w-5" /> End Call
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
