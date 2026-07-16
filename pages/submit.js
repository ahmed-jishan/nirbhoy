import { useState, useRef, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { getTurnstileSiteKey } from "../lib/captcha";

const MAX_TOTAL_MB = 30;
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;
const MAX_FILES = 10;

// Complete Bangladesh administrative hierarchy
const DIVISIONS = ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "সিলেট", "বরিশাল", "রংপুর", "ময়মনসিংহ"];

const DIVISION_DISTRICTS = {
  "ঢাকা": [
    "ঢাকা", "নারায়ণগঞ্জ", "গাজীপুর", "টাঙ্গাইল", "কিশোরগঞ্জ", "মানিকগঞ্জ",
    "মুন্সিগঞ্জ", "নরসিংদী", "ফরিদপুর", "মাদারীপুর", "শরীয়তপুর", "রাজবাড়ী", "গোপালগঞ্জ",
  ],
  "চট্টগ্রাম": [
    "চট্টগ্রাম", "কক্সবাজার", "কুমিল্লা", "নোয়াখালী", "ফেনী", "ব্রাহ্মণবাড়িয়া",
    "চাঁদপুর", "লক্ষ্মীপুর", "বান্দরবান", "রাঙ্গামাটি", "খাগড়াছড়ি",
  ],
  "রাজশাহী": [
    "রাজশাহী", "বগুড়া", "পাবনা", "সিরাজগঞ্জ", "নাটোর", "জয়পুরহাট", "নওগাঁ",
  ],
  "খুলনা": [
    "খুলনা", "যশোর", "কুষ্টিয়া", "সাতক্ষীরা", "মাগুরা", "নড়াইল", "চুয়াডাঙ্গা", "মেহেরপুর", "ঝিনাইদহ",
  ],
  "সিলেট": [
    "সিলেট", "হবিগঞ্জ", "মৌলভীবাজার", "সুনামগঞ্জ",
  ],
  "বরিশাল": [
    "বরিশাল", "পটুয়াখালী", "ভোলা", "পিরোজপুর", "বরগুনা", "ঝালকাঠি",
  ],
  "রংপুর": [
    "রংপুর", "দিনাজপুর", "লালমনিরহাট", "কুড়িগ্রাম", "গাইবান্ধা", "নীলফামারী", "পঞ্চগড়", "ঠাকুরগাঁও",
  ],
  "ময়মনসিংহ": [
    "ময়মনসিংহ", "নেত্রকোনা", "জামালপুর", "শেরপুর",
  ],
};

const DISTRICT_THANAS = {
  "ঢাকা": ["সদর", "কোতোয়ালী", "যাত্রাবাড়ী", "ডেমরা", "গুলশান", "মিরপুর", "উত্তরা", "মোহাম্মদপুর", "ধানমন্ডি", "তেজগাঁও", "আদর্শ", "কেরানীগঞ্জ", "নবাবগঞ্জ", "দোহার", "সাভার", "ধামরাই"],
  "নারায়ণগঞ্জ": ["সদর", "আড়াইহাজার", "বন্দর", "রূপগঞ্জ", "সোনারগাঁও", "ফতুল্লা", "সিদ্ধিরগঞ্জ"],
  "গাজীপুর": ["সদর", "কালিয়াকৈর", "কালীগঞ্জ", "কাপাসিয়া", "শ্রীপুর"],
  "টাঙ্গাইল": ["সদর", "কালিহাতী", "ঘাটাইল", "বাসাইল", "ভুয়াপুর", "গোপালপুর", "মধুপুর", "ধনবাড়ী", "দেলদুয়ার", "নাগরপুর", "সখিপুর"],
  "কিশোরগঞ্জ": ["সদর", "কটিয়াদী", "কুলিয়ারচর", "তাড়াইল", "নিকলী", "পাকুন্দিয়া", "বাজিতপুর", "ভৈরব", "মিটামইন", "হোসেনপুর", "অষ্টগ্রাম", "ইটনা", "করিমগঞ্জ"],
  "মানিকগঞ্জ": ["সদর", "ঘিওর", "দৌলতপুর", "শিবালয়", "সাটুরিয়া", "সিঙ্গাইর", "হরিরামপুর"],
  "মুন্সিগঞ্জ": ["সদর", "গজারিয়া", "টংগিবাড়ী", "লৌহজং", "সিরাজদীখান", "শ্রীনগর"],
  "নরসিংদী": ["সদর", "পলাশ", "বেলাবো", "মনোহরদী", "রায়পুরা", "শিবপুর"],
  "ফরিদপুর": ["সদর", "আলফাডাঙ্গা", "চর ভদ্রাসন", "নগরকান্দা", "বোয়ালমারী", "ভাঙ্গা", "মধুখালী", "সদরপুর", "সালথা"],
  "মাদারীপুর": ["সদর", "কালকিনি", "ডামুড্যা", "শিবচর", "রাজৈর"],
  "শরীয়তপুর": ["সদর", "গোসাইরহাট", "ডামুড্যা", "নড়িয়া", "ভেদরগঞ্জ", "জাজিরা"],
  "রাজবাড়ী": ["সদর", "কালুখালী", "গোয়ালন্দ", "পাংশা", "বালিয়াকান্দি"],
  "গোপালগঞ্জ": ["সদর", "কাশিয়ানী", "টুংগীপাড়া", "মুকসুদপুর", "কোটালীপাড়া"],
  "চট্টগ্রাম": ["সদর", "কোতোয়ালী", "পাঁচলাইশ", "চন্দনাইশ", "বাঁশখালী", "পটিয়া", "রাঙ্গুনিয়া", "হাটহাজারী", "ফটিকছড়ি", "রাউজান", "সাতকানিয়া", "বোয়ালখালী", "আনোয়ারা", "মিরসরাই", "লোহাগাড়া", "সন্দ্বীপ", "সীতাকুণ্ড", "কর্ণফুলী"],
  "কক্সবাজার": ["সদর", "চকরিয়া", "টেকনাফ", "উখিয়া", "কুতুবদিয়া", "পেকুয়া", "মহেশখালী", "রামু"],
  "কুমিল্লা": ["সদর", "আদর্শ সদর", "ব্রাহ্মণপাড়া", "বুড়িচং", "চৌদ্দগ্রাম", "দাউদকান্দি", "দেবিদ্বার", "হোমনা", "লাকসাম", "মুরাদনগর", "নাঙ্গলকোট", "তিতাস", "মেঘনা", "মনোহরগঞ্জ", "সদর দক্ষিণ", "সদর উত্তর"],
  "নোয়াখালী": ["সদর", "কবিরহাট", "কোম্পানীগঞ্জ", "চাটখিল", "বেগমগঞ্জ", "সুবর্ণচর", "সেনবাগ", "হাতিয়া", "সোনাইমুড়ি"],
  "ফেনী": ["সদর", "ছাগলনাইয়া", "দাগনভূঞা", "ফুলগাজী", "পরশুরাম", "সোনাগাজী"],
  "ব্রাহ্মণবাড়িয়া": ["সদর", "আখাউড়া", "আশুগঞ্জ", "নবীনগর", "নাসিরনগর", "বাঞ্ছারামপুর", "বিজয়নগর", "সরাইল", "কসবা"],
  "চাঁদপুর": ["সদর", "কচুয়া", "ফরিদগঞ্জ", "হাইমচর", "হাজীগঞ্জ", "শাহরাস্তি", "মতলব উত্তর", "মতলব দক্ষিণ"],
  "লক্ষ্মীপুর": ["সদর", "রামগঞ্জ", "রামগতি", "রায়পুর", "কমলনগর"],
  "বান্দরবান": ["সদর", "আলীকদম", "নাইক্ষ্যংছড়ি", "রোয়াংছড়ি", "রুমা", "থানচি", "লামা"],
  "রাঙ্গামাটি": ["সদর", "কাপ্তাই", "কাউখালী", "বগাচতর", "বরকল", "লংগদু", "রাজস্থলী", "বিলাইছড়ি", "জুরাছড়ি", "নানিয়ারচর"],
  "খাগড়াছড়ি": ["সদর", "দিঘীনালা", "পানছড়ি", "মহালছড়ি", "মাটিরাঙ্গা", "মানিকছড়ি", "লক্ষ্মীছড়ি", "রামগড়"],
  "রাজশাহী": ["সদর", "বোয়ালিয়া", "মতিহার", "শাহমখদুম", "চারঘাট", "পবা", "বাঘা", "গোদাগাড়ী", "তানোড়", "দুর্গাপুর", "পুঠিয়া", "বাগমারা", "মোহনপুর"],
  "বগুড়া": ["সদর", "আদমদীঘি", "ধুনট", "ধূপচাঁচিয়া", "গাবতলী", "শাজাহানপুর", "শিবগঞ্জ", "সারিয়াকান্দি", "সোনাতলা", "নন্দীগ্রাম", "কাহালু"],
  "পাবনা": ["সদর", "আটঘরিয়া", "ঈশ্বরদী", "চাটমোহর", "ফরিদপুর", "বেড়া", "ভাঙ্গুরা", "সাঁথিয়া", "সুজানগর"],
  "সিরাজগঞ্জ": ["সদর", "তাড়াশ", "রায়গঞ্জ", "উল্লাপাড়া", "কামারখন্দ", "কাজীপুর", "বেলকুচি", "চৌহালি", "শাহজাদপুর"],
  "নাটোর": ["সদর", "গুরুদাসপুর", "নলডাঙ্গা", "বড়াইগ্রাম", "বাগাতিপাড়া", "লালপুর", "সিংড়া"],
  "জয়পুরহাট": ["সদর", "আক্কেলপুর", "কালাই", "ক্ষেতলাল", "পাঁচবিবি"],
  "নওগাঁ": ["সদর", "আত্রাই", "মান্দা", "নিয়ামতপুর", "পত্নীতলা", "রাণীনগর", "সাপাহার", "বদলগাছী", "ধামইরহাট", "মহাদেবপুর", "পোরশা"],
  "খুলনা": ["সদর", "দৌলতপুর", "খালিশপুর", "সোনাডাঙ্গা", "হরিণটানা", "পাইকগাছা", "বটিয়াঘাটা", "ডুমুরিয়া", "কয়রা", "দাকোপ", "তেরখাদা", "ফুলতলা", "রূপসা", "দিঘলিয়া"],
  "যশোর": ["সদর", "অভয়নগর", "বাঘেরপাড়া", "চৌগাছা", "ঝিকরগাছা", "কেশবপুর", "মণিরামপুর", "শার্শা"],
  "কুষ্টিয়া": ["সদর", "কুমারখালী", "খোকসা", "দৌলতপুর", "মিরপুর", "ভেড়ামারা"],
  "সাতক্ষীরা": ["সদর", "আশাশুনি", "কলারোয়া", "কালীগঞ্জ", "তালা", "দেবহাটা", "শ্যামনগর"],
  "মাগুরা": ["সদর", "মোহাম্মদপুর", "শালিখা", "শ্রীপুর"],
  "নড়াইল": ["সদর", "কালিয়া", "লোহাগড়া"],
  "চুয়াডাঙ্গা": ["সদর", "আলমডাঙ্গা", "দামুড়হুদা", "জীবননগর"],
  "মেহেরপুর": ["সদর", "মুজিবনগর", "গাংনী"],
  "ঝিনাইদহ": ["সদর", "কালীগঞ্জ", "কোটচাঁদপুর", "মহেশপুর", "শৈলকুপা", "হরিণাকুন্ডু"],
  "সিলেট": ["সদর", "কোতোয়ালী", "বালাগঞ্জ", "বিয়ানীবাজার", "বিশ্বনাথ", "কানাইঘাট", "জকিগঞ্জ", "গোলাপগঞ্জ", "ফেঞ্চুগঞ্জ", "কোম্পানীগঞ্জ", "গোয়াইনঘাট", "জৈন্তাপুর", "ওসমানীনগর", "দক্ষিণ সুরমা"],
  "হবিগঞ্জ": ["সদর", "আজমিরীগঞ্জ", "চুনারুঘাট", "নবীগঞ্জ", "বানিয়াচং", "বাহুবল", "মাধবপুর", "লাখাই"],
  "মৌলভীবাজার": ["সদর", "কমলগঞ্জ", "জুড়ী", "বড়লেখা", "রাজনগর", "শ্রীমঙ্গল", "কুলাউড়া"],
  "সুনামগঞ্জ": ["সদর", "ছাতক", "জগন্নাথপুর", "দক্ষিণ সুনামগঞ্জ", "ধর্মপাশা", "দিরাই", "বিশ্বম্ভরপুর", "তাহিরপুর", "জামালগঞ্জ", "শাল্লা", "দোয়ারাবাজার"],
  "বরিশাল": ["সদর", "কোতোয়ালী", "আগৈলঝাড়া", "বাকেরগঞ্জ", "বানারীপাড়া", "গৌরনদী", "হিজলা", "মেহেন্দিগঞ্জ", "মুলাদী", "বাবুগঞ্জ", "উজিরপুর"],
  "পটুয়াখালী": ["সদর", "বাউফল", "গলাচিপা", "কলাপাড়া", "দশমিনা", "মির্জাগঞ্জ", "দুমকী", "রাঙ্গাবালী"],
  "ভোলা": ["সদর", "চরফ্যাশন", "লালমোহন", "তজুমদ্দিন", "মনপুরা", "সদর উত্তর", "দৌলতখান", "বোরহানউদ্দিন"],
  "পিরোজপুর": ["সদর", "নাজিরপুর", "কাউখালী", "জিয়ানগর", "ভাণ্ডারিয়া", "মঠবাড়িয়া", "নেছারাবাদ"],
  "বরগুনা": ["সদর", "আমতলী", "পাথরঘাটা", "বামনা", "বেতাগী"],
  "ঝালকাঠি": ["সদর", "কাঁঠালিয়া", "নলছিটি", "রাজাপুর"],
  "রংপুর": ["সদর", "পীরগঞ্জ", "বদরগঞ্জ", "গংগাচড়া", "তারাগঞ্জ", "কাউনিয়া", "মিঠাপুকুর", "পীরগাছা"],
  "দিনাজপুর": ["সদর", "বীরগঞ্জ", "কাহারোল", "খানসামা", "ঘোড়াঘাট", "চিরিরবন্দর", "পার্বতীপুর", "ফুলবাড়ী", "বোচাগঞ্জ", "বিরামপুর", "নবাবগঞ্জ", "হাকিমপুর", "বিরল"],
  "লালমনিরহাট": ["সদর", "আদিতমারী", "কালীগঞ্জ", "হাতীবান্ধা", "পাটগ্রাম"],
  "কুড়িগ্রাম": ["সদর", "নাগেশ্বরী", "ভুরুঙ্গামারী", "ফুলবাড়ী", "রাজারহাট", "চিলমারী", "উলিপুর", "রৌমারী", "চর রাজিবপুর"],
  "গাইবান্ধা": ["সদর", "গোবিন্দগঞ্জ", "পলাশবাড়ী", "সাদুল্লাপুর", "সাঘাটা", "সুন্দরগঞ্জ", "ফুলছড়ি"],
  "নীলফামারী": ["সদর", "কিশোরগঞ্জ", "ডোমার", "ডিমলা", "জলঢাকা", "সৈয়দপুর"],
  "পঞ্চগড়": ["সদর", "আটোয়ারী", "দেবীগঞ্জ", "বোদা", "তেতুলিয়া"],
  "ঠাকুরগাঁও": ["সদর", "বালিয়াডাঙ্গী", "রাণীশংকৈল", "পীরগঞ্জ", "হরিপুর"],
  "ময়মনসিংহ": ["সদর", "কোতোয়ালী", "ঈশ্বরগঞ্জ", "গফরগাঁও", "গৌরীপুর", "ত্রিশাল", "ধোবাউড়া", "নান্দাইল", "ফুলবাড়িয়া", "ফুলপুর", "ভালুকা", "মুক্তাগাছা", "হালুয়াঘাট"],
  "নেত্রকোনা": ["সদর", "আটপাড়া", "কলমাকান্দা", "কেন্দুয়া", "খালিয়াজুড়ি", "দুর্গাপুর", "পূর্বধলা", "বারহাট্টা", "মদন", "মোহনগঞ্জ"],
  "জামালপুর": ["সদর", "ইসলামপুর", "দেওয়ানগঞ্জ", "বকশীগঞ্জ", "মাদারগঞ্জ", "মেলান্দহ", "সরিষাবাড়ী"],
  "শেরপুর": ["সদর", "নকলা", "নালিতাবাড়ী", "ঝিনাইগাতী", "শ্রীবরদী"],
};

async function uploadSingleFile(file, setFileProgress) {
  const sigRes = await fetch("/api/upload-signature", { method: "POST" });
  if (!sigRes.ok) throw new Error("Could not prepare the file upload.");
  const sig = await sigRes.json();

  const resourceType = file.type.startsWith("video/") ? "video" : "image";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", sig.timestamp);
  formData.append("signature", sig.signature);
  formData.append("public_id", sig.publicId);
  formData.append("folder", sig.folder);
  formData.append("type", sig.type);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`;

  const result = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setFileProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new Error("File upload failed."));
    };
    xhr.onerror = () => reject(new Error("File upload failed."));
    xhr.send(formData);
  });

  return { publicId: result.public_id, resourceType };
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

export default function Submit() {
  const [type, setType] = useState("incident");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [city, setCity] = useState("");
  const [postOffice, setPostOffice] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [files, setFiles] = useState([]);
  const [fileProgress, setFileProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);
  const turnstileSiteKey = getTurnstileSiteKey();

  // Filter districts by selected division
  const availableDistricts = useMemo(() => {
    if (!division) return [];
    return DIVISION_DISTRICTS[division] || [];
  }, [division]);

  // Filter thanas by selected district
  const availableThanas = useMemo(() => {
    if (!district) return [];
    return DISTRICT_THANAS[district] || [];
  }, [district]);

  // Reset district/thana when division changes
  function handleDivisionChange(val) {
    setDivision(val);
    setDistrict("");
    setThana("");
  }

  // Reset thana when district changes
  function handleDistrictChange(val) {
    setDistrict(val);
    setThana("");
  }

  function handleFileChange(e) {
    setError("");
    const selected = Array.from(e.target.files || []);

    if (files.length + selected.length > MAX_FILES) {
      setError(`সর্বোচ্চ ${MAX_FILES}টি ফাইল আপলোড করা যাবে।`);
      e.target.value = "";
      return;
    }

    const existingSize = files.reduce((sum, f) => sum + f.size, 0);
    const newSize = selected.reduce((sum, f) => sum + f.size, 0);
    if (existingSize + newSize > MAX_TOTAL_BYTES) {
      setError(`সব ফাইলের মোট আকার ${MAX_TOTAL_MB}MB এর কম হতে হবে।`);
      e.target.value = "";
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (title.trim().length < 4) return setError("অনুগ্রহ করে একটি শিরোনাম লিখুন (কমপক্ষে ৪ অক্ষর)।");
    if (description.trim().length < 20) return setError("অনুগ্রহ করে বিস্তারিত লিখুন (কমপক্ষে ২০ অক্ষর)।");
    if (!district) return setError("অনুগ্রহ করে জেলা নির্বাচন করুন।");
    if (!thana) return setError("অনুগ্রহ করে থানা নির্বাচন করুন।");

    setSubmitting(true);
    setUploading(true);
    try {
      const proofs = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setFileProgress((prev) => ({ ...prev, [i]: 0 }));
        const { publicId, resourceType } = await uploadSingleFile(file, (pct) => {
          setFileProgress((prev) => ({ ...prev, [i]: pct }));
        });
        proofs.push({ publicId, resourceType });
        setFileProgress((prev) => ({ ...prev, [i]: 100 }));
      }
      setUploading(false);

      const location = {
        division: division || "",
        district,
        thana,
        city: city || "",
        postOffice: postOffice || "",
        postalCode: postalCode || "",
        detail: locationDetail || "",
      };

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          location,
          proofs,
          captchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "জমা দেওয়া যায়নি।");

      setCaseId(data.caseId);
    } catch (err) {
      setError(err.message || "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setUploading(false);
    } finally {
      setSubmitting(false);
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  if (caseId) {
    return (
      <>
        <Head><title>জমা সম্পন্ন — Nirbhoy</title></Head>
        <SiteHeader />
        <section className="mx-auto max-w-lg px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-none border border-accent/30 bg-accent-glow px-4 py-2 font-terminal text-xs text-accent">
            <span className="term-ok">[ OK ]</span> সফলভাবে জমা হয়েছে
          </div>
          <div className="case-stamp mt-6 !inline-flex text-base">{caseId}</div>
          <h1 className="mt-6 font-display text-2xl font-semibold text-text-primary">
            এই কেস নম্বরটি সংরক্ষণ করুন
          </h1>
          <p className="mt-3 font-code text-sm leading-relaxed text-text-muted">
            আমরা কোনো লগইন বা পরিচয় সংরক্ষণ করি না, তাই এই নম্বরটিই ভবিষ্যতে অবস্থা যাচাইয়ের একমাত্র
            উপায়। এটি স্ক্রিনশট নিয়ে রাখুন বা লিখে রাখুন।
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link href="/track" className="btn-primary">স্ট্যাটাস যাচাই করুন</Link>
            <Link href="/" className="btn-ghost">হোমে ফিরে যান</Link>
          </div>
        </section>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <Head><title>রিপোর্ট জমা দিন — Nirbhoy</title></Head>
      <SiteHeader />

      <section className="mx-auto max-w-xl px-6 py-14">
        <div className="flex items-center gap-3">
          <span className="font-terminal text-sm text-accent">$</span>
          <h1 className="font-display text-3xl font-semibold text-text-primary">রিপোর্ট জমা দিন</h1>
        </div>
        <p className="mt-3 font-code text-sm text-text-muted">
          <span className="term-info">$</span> কোনো অ্যাকাউন্ট লাগবে না। আপনার নাম বা পরিচয় সংরক্ষণ করা হয় না।
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          {/* Type */}
          <div>
            <span className="field-label">{'>'} ধরন</span>
            <div className="grid grid-cols-2 gap-3">
              <TypeOption
                label="অপরাধ / ঘটনা"
                hint="যেমন চুরি, সহিংসতা — যা কর্তৃপক্ষকে জানানো দরকার"
                active={type === "incident"}
                onClick={() => setType("incident")}
              />
              <TypeOption
                label="সাধারণ অভিযোগ"
                hint="যেমন সেবা, দুর্নীতি, অব্যবস্থাপনা নিয়ে অসন্তোষ"
                active={type === "grievance"}
                onClick={() => setType("grievance")}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="field-label" htmlFor="title">{'>'} শিরোনাম</label>
            <input
              id="title"
              className="field-input"
              value={title}
              maxLength={140}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="$ সংক্ষেপে কী ঘটেছে"
            />
          </div>

          {/* Description */}
          <div>
            <label className="field-label" htmlFor="description">{'>'} বিস্তারিত বিবরণ</label>
            <textarea
              id="description"
              className="field-input min-h-[140px] resize-y"
              value={description}
              maxLength={4000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="$ কী হয়েছে, কখন হয়েছে, বিস্তারিত লিখুন। নিজের নাম উল্লেখ করার প্রয়োজন নেই।"
            />
            <p className="field-hint">$ {description.length}/4000</p>
          </div>

          {/* Structured Location with cascading dropdowns */}
          <div>
            <span className="field-label">{'>'} ঘটনার অবস্থান</span>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Division */}
              <div>
                <label className="field-label !text-xs !mb-1">বিভাগ</label>
                <select
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="field-input"
                >
                  <option value="">— বিভাগ নির্বাচন করুন —</option>
                  {DIVISIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* District — filtered by division */}
              <div>
                <label className="field-label !text-xs !mb-1">জেলা *</label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="field-input"
                  required
                  disabled={!division}
                >
                  <option value="">— জেলা নির্বাচন করুন —</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {division && availableDistricts.length === 0 && (
                  <p className="field-hint">এই বিভাগের অধীনে কোনো জেলা পাওয়া যায়নি</p>
                )}
              </div>

              {/* Thana — filtered by district */}
              <div>
                <label className="field-label !text-xs !mb-1">থানা *</label>
                <select
                  value={thana}
                  onChange={(e) => setThana(e.target.value)}
                  className="field-input"
                  required
                  disabled={!district}
                >
                  <option value="">— থানা নির্বাচন করুন —</option>
                  {availableThanas.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {district && availableThanas.length === 0 && (
                  <p className="field-hint">এই জেলার অধীনে কোনো থানা পাওয়া যায়নি</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="field-label !text-xs !mb-1">শহর / পৌরসভা</label>
                <input
                  className="field-input"
                  value={city}
                  maxLength={100}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="যেমন: ঢাকা শহর"
                />
              </div>

              {/* Post Office */}
              <div>
                <label className="field-label !text-xs !mb-1">পোস্ট অফিস</label>
                <input
                  className="field-input"
                  value={postOffice}
                  maxLength={100}
                  onChange={(e) => setPostOffice(e.target.value)}
                  placeholder="পোস্ট অফিসের নাম"
                />
              </div>

              {/* Postal Code */}
              <div>
                <label className="field-label !text-xs !mb-1">পোস্টাল কোড</label>
                <input
                  className="field-input"
                  value={postalCode}
                  maxLength={10}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="যেমন: 1205"
                />
              </div>
            </div>

            {/* Detail */}
            <div className="mt-3">
              <label className="field-label !text-xs !mb-1" htmlFor="locationDetail">বিস্তারিত ঠিকানা (ঐচ্ছিক)</label>
              <input
                id="locationDetail"
                className="field-input"
                value={locationDetail}
                maxLength={300}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="$ গ্রাম, রাস্তার নাম, বা অন্যান্য তথ্য (সঠিক ঠিকানা না দিলেও চলবে)"
              />
            </div>

            <p className="field-hint mt-2">
              $ প্রথমে বিভাগ নির্বাচন করুন → তারপর জেলা → তারপর থানা। জেলা ও থানা বাধ্যতামূলক।
            </p>
          </div>

          {/* Files */}
          <div>
            <label className="field-label">{'>'} প্রমাণ (ঐচ্ছিক — ছবি ও ভিডিও)</label>
            <input
              id="file"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="field-input file:mr-4 file:rounded-none file:border-0 file:bg-elevated2 file:px-3 file:py-1.5 file:font-terminal file:text-sm file:text-accent"
              disabled={files.length >= MAX_FILES}
            />
            <p className="field-hint">
              $ একাধিক ছবি/ভিডিও নির্বাচন করুন। মোট আকার সর্বোচ্চ {MAX_TOTAL_MB}MB (সর্বোচ্চ {MAX_FILES}টি ফাইল)।
              ফাইল প্রাইভেট থাকে — শুধুমাত্র যাচাইকারী মডারেটর দেখতে পারবেন।
            </p>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-terminal text-xs text-text-faint">
                    $ {files.length}টি ফাইল · মোট {formatFileSize(totalSize)} / {MAX_TOTAL_MB}MB
                  </span>
                </div>
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-none border border-border bg-elevated p-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-code text-sm text-text-primary">{file.name}</p>
                      <p className="font-terminal text-xs text-text-faint">{formatFileSize(file.size)}</p>
                      {(submitting || uploading) && (
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-none bg-elevated2">
                          <div
                            className="h-full bg-accent transition-all duration-300"
                            style={{ width: `${fileProgress[i] || 0}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {!submitting && !uploading && (
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="shrink-0 rounded-none p-1 text-text-faint hover:text-danger transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                    {uploading && fileProgress[i] === 100 && (
                      <span className="shrink-0 font-terminal text-xs text-accent">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CAPTCHA */}
          {turnstileSiteKey && (
            <div>
              <div
                ref={captchaRef}
                className="cf-turnstile"
                data-sitekey={turnstileSiteKey}
                data-callback={(token) => setCaptchaToken(token)}
                data-theme="dark"
              />
            </div>
          )}

          {error && (
            <p className="rounded-none border border-danger/40 bg-danger-soft px-4 py-3 font-code text-sm text-danger">
              <span className="term-err">[!]</span> {error}
            </p>
          )}

          <button type="submit" disabled={submitting || (turnstileSiteKey && !captchaToken)} className="btn-primary w-full">
            {submitting
              ? uploading
                ? `$ আপলোড হচ্ছে… (${Object.values(fileProgress).filter((p) => p === 100).length}/${files.length})`
                : "$ জমা হচ্ছে…"
              : "$ নাম প্রকাশ ছাড়াই জমা দিন"}
          </button>
        </form>
      </section>

      <SiteFooter />
    </>
  );
}

function TypeOption({ label, hint, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-none border p-4 text-left transition-colors ${
        active ? "border-accent/60 bg-accent-glow" : "border-borderStrong bg-elevated hover:border-accent/30"
      }`}
    >
      <p className="font-code text-sm font-semibold text-text-primary">{label}</p>
      <p className="mt-1 font-code text-xs leading-relaxed text-text-muted">{hint}</p>
    </button>
  );
}