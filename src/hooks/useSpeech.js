import { useState, useEffect, useRef } from "react";

const LANGUAGE_SPECS = {
  "ja-JP": {
    checkRegex: /[\u3040-\u309F\u30A0-\u30FF]/,
    cleanStrategy: "removeBrackets",
  },
  "th-TH": {
    checkRegex: /[\u0E00-\u0E7F]/,
    cleanStrategy: "keepOnlyMatches",
  },
  "ko-KR": {
    checkRegex: /[\uAC00-\uD7AF\u1100-\u11FF]/,
    cleanStrategy: "removeBrackets",
  },
  "vi-VN": {
    checkRegex: /[a-zA-Z\u00C0-\u1EF9]/,
    cleanStrategy: "removeBrackets",
  },
};

export const useSpeech = ({ tripConfig, onTranscript }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [listeningLang, setListeningLang] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "zh-TW";

      recognitionRef.current.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (onTranscript) {
          onTranscript(transcript);
        }
      };
      recognitionRef.current.onend = () => {
        setListeningLang(null);
      };
      recognitionRef.current.onerror = () => {
        setListeningLang(null);
      };
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current = null;
          setListeningLang(null);
        } catch (error) {
          console.error("清理語音識別資源時出錯:", error);
        }
      }
    };
  }, [onTranscript]);

  const toggleListening = (lang, onError) => {
    if (!recognitionRef.current) {
      alert("抱歉，您的瀏覽器不支援語音輸入功能。");
      return;
    }

    try {
      if (listeningLang === lang) {
        recognitionRef.current.stop();
        setListeningLang(null);
      } else {
        if (listeningLang) {
          recognitionRef.current.stop();
        }
        if (onTranscript) onTranscript(""); // Clear input when starting new
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
        setListeningLang(lang);
      }
    } catch (error) {
      console.error("語音識別操作出錯:", error);
      setListeningLang(null);
      if (onError) onError("語音輸入出現問題，請重試");
    }
  };

  const handleSpeak = (text, onError) => {
    if (!("speechSynthesis" in window)) {
      alert("抱歉，您的瀏覽器不支援語音朗讀功能。");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToSpeak = text.replace(/\*\*/g, "");
    const configLangCode = tripConfig.language.code;

    const normalizeLang = (code) => code.replace("_", "-").toLowerCase();

    const targetVoice =
      availableVoices.find(
        (v) => normalizeLang(v.lang) === normalizeLang(configLangCode),
      ) ||
      availableVoices.find((v) =>
        normalizeLang(v.lang).includes(normalizeLang(configLangCode)),
      );

    const shouldTryForeign = configLangCode !== "zh-TW";

    const spec = LANGUAGE_SPECS[configLangCode] || {
      checkRegex: /.*/,
      cleanStrategy: "removeBrackets",
    };

    if (shouldTryForeign) {
      if (spec.cleanStrategy === "keepOnlyMatches") {
        const matches = textToSpeak.match(new RegExp(spec.checkRegex, "g"));
        if (matches) textToSpeak = matches.join(" ");
      } else {
        textToSpeak = textToSpeak.replace(/\s*[()（].*?[)）]/g, "");
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (shouldTryForeign) {
      utterance.lang = configLangCode;
      if (targetVoice) {
        utterance.voice = targetVoice;
      } else {
        console.warn("未找到特定語音包，嘗試使用系統預設語言");
      }
    } else {
      utterance.lang = "zh-TW";
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("Speech Error:", e);
      setIsSpeaking(false);
      if (e.error !== "interrupted") {
        if (onError) onError("語音播放失敗，請檢查手機設定");
      }
    };

    window.speechSynthesis.speak(utterance);
  };
  
  const cancelSpeak = () => {
    if (isSpeaking) {
       window.speechSynthesis.cancel();
       setIsSpeaking(false);
    }
  }

  return {
    isSpeaking,
    handleSpeak,
    cancelSpeak,
    listeningLang,
    toggleListening,
  };
};
