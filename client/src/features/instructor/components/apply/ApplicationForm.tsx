import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Phone, MapPin, GraduationCap, Briefcase, Wrench, MessageSquareQuote,
  Tag, Linkedin, Github, Link2, Globe, CreditCard, Receipt, Landmark, Building2,
  UserRound, Hash, Wallet, Send, CheckCircle2, ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { instructorApi } from '@/api/endpoints/instructor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/providers/ToastProvider';
import { FormSection } from './FormSection';

export interface ApplyFormState {
  name: string;
  email: string;
  phone: string;
  address: string;
  qualification: string;
  experience: string;
  expertise: string;
  reason: string;
  linkedin: string;
  github: string;
  portfolio: string;
  website: string;
  bio: string;
  categories: string;
  photo: File | null;
  resume: File | null;
  demoVideo: File | null;
  identityProof: File | null;
  taxPan: string;
  taxGst: string;
  bankHolder: string;
  bankAccount: string;
  bankIfsc: string;
  bankName: string;
  bankBranch: string;
  bankUpi: string;
}

type FieldKey = keyof ApplyFormState;

const REQUIRED_FIELDS: FieldKey[] = [
  'name', 'email', 'phone', 'address',
  'qualification', 'experience', 'categories', 'reason',
  'bankHolder', 'bankAccount', 'bankIfsc', 'bankName',
];

interface SectionConfig {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  fields: readonly FieldKey[];
}

const SECTIONS: SectionConfig[] = [
  {
    key: 'personal',
    icon: User,
    title: 'Personal Information',
    description: 'Tell us who you are.',
    fields: ['name', 'email', 'phone', 'address', 'photo'],
  },
  {
    key: 'professional',
    icon: GraduationCap,
    title: 'Professional Background',
    description: 'Your credentials, experience, and expertise.',
    fields: ['qualification', 'experience', 'expertise', 'bio'],
  },
  {
    key: 'teaching',
    icon: MessageSquareQuote,
    title: 'Teaching Motivation',
    description: 'Why do you want to teach on NextEra?',
    fields: ['categories', 'reason'],
  },
  {
    key: 'portfolio',
    icon: Briefcase,
    title: 'Portfolio',
    description: 'Showcase your work, profiles, and demo video.',
    fields: ['linkedin', 'github', 'portfolio', 'website', 'demoVideo'],
  },
  {
    key: 'verification',
    icon: UserRound,
    title: 'Verification & Payouts',
    description: 'Identity documents and payout details.',
    fields: ['resume', 'identityProof', 'taxPan', 'taxGst', 'bankHolder', 'bankAccount', 'bankIfsc', 'bankName', 'bankBranch', 'bankUpi'],
  },
];

function FileFieldLabel({ children }: { children: string }) {
  return <span className="mb-1.5 block text-sm font-medium text-foreground">{children}</span>;
}

export function ApplicationForm() {
  const [form, setForm] = useState<ApplyFormState>({
    name: '', email: '', phone: '', address: '',
    qualification: '', experience: '', expertise: '', reason: '',
    linkedin: '', github: '', portfolio: '', website: '', bio: '', categories: '',
    photo: null,
    resume: null,
    demoVideo: null,
    identityProof: null,
    taxPan: '', taxGst: '',
    bankHolder: '', bankAccount: '', bankIfsc: '', bankName: '', bankBranch: '', bankUpi: '',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: ApplyFormState) => {
      const fd = new FormData();
      const append = (key: string, value: unknown) => {
        if (value === null || value === undefined || value === '') return;
        if (value instanceof File) fd.append(key, value);
        else fd.append(key, String(value));
      };

      append('fullName', data.name);
      append('email', data.email);
      append('phone', data.phone);
      append('address', data.address);
      append('qualification', data.qualification);
      append('experience', data.experience);
      append('expertise', data.expertise);
      append('reason', data.reason);
      append('linkedin', data.linkedin);
      append('github', data.github);
      append('portfolio', data.portfolio);
      append('website', data.website);
      append('bio', data.bio);

      const categories = data.categories.split(',').map((c) => c.trim()).filter(Boolean);
      fd.append('teachingCategories', JSON.stringify(categories));

      const taxDetails: Record<string, string> = {};
      if (data.taxPan.trim()) taxDetails.pan = data.taxPan.trim();
      if (data.taxGst.trim()) taxDetails.gst = data.taxGst.trim();
      if (Object.keys(taxDetails).length > 0) fd.append('taxDetails', JSON.stringify(taxDetails));

      fd.append('bankDetails', JSON.stringify({
        accountHolderName: data.bankHolder,
        accountNumber: data.bankAccount,
        ifscCode: data.bankIfsc,
        bankName: data.bankName,
        branch: data.bankBranch,
        upiId: data.bankUpi,
      }));

      append('photo', data.photo);
      append('resume', data.resume);
      append('demoVideo', data.demoVideo);
      append('identityProof', data.identityProof);

      return instructorApi.apply(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'application-status'] });
      addToast({ title: 'Application submitted', variant: 'success' });
    },
    onError: (err) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to submit';
      addToast({ title: message, variant: 'error' });
    },
  });

  const update = (key: FieldKey) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setFile = (key: FieldKey) => (file: File | null) =>
    setForm((prev) => ({ ...prev, [key]: file }));

  const isSectionDone = (fields: readonly FieldKey[]) =>
    fields.every((key) => {
      const value = form[key];
      return value !== null && value !== undefined && (typeof value !== 'string' || value.trim() !== '');
    });

  const hasRequiredField = (fields: readonly FieldKey[]) =>
    fields.some((field) => REQUIRED_FIELDS.includes(field));

  const requiredDone = REQUIRED_FIELDS.filter((key) => (form[key] as string).trim() !== '').length;
  const progress = Math.round((requiredDone / REQUIRED_FIELDS.length) * 100);
  const canSubmit = mutation.isPending || requiredDone < REQUIRED_FIELDS.length;

  const submit = () => {
    if (requiredDone < REQUIRED_FIELDS.length) return;
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Application progress</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {requiredDone} of {REQUIRED_FIELDS.length} required fields completed
            </p>
          </div>
          <span className="text-lg font-bold text-primary tabular-nums">{progress}%</span>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Application progress"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-aura-secondary transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="mt-5 flex items-center gap-2" aria-label="Form sections">
          {SECTIONS.map((section, index) => {
            const done = isSectionDone(section.fields);
            return (
              <li key={section.key} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  aria-label={`${section.title} ${done ? 'complete' : 'incomplete'}`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </span>
                {index < SECTIONS.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Section 1 - Personal Information */}
      <FormSection
        icon={User}
        title="Personal Information"
        description="Tell us who you are."
        required={hasRequiredField(SECTIONS[0].fields)}
        done={isSectionDone(SECTIONS[0].fields)}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="apply-name"
            label="Full Name *"
            icon={<User className="h-5 w-5" aria-hidden="true" />}
            placeholder="Jane Doe"
            helperText="Your legal name as shown on your ID."
            value={form.name}
            onChange={update('name')}
          />
          <Input
            id="apply-email"
            type="email"
            label="Email *"
            icon={<Mail className="h-5 w-5" aria-hidden="true" />}
            placeholder="you@example.com"
            helperText="We'll send application updates here."
            value={form.email}
            onChange={update('email')}
          />
          <Input
            id="apply-phone"
            type="tel"
            label="Phone *"
            icon={<Phone className="h-5 w-5" aria-hidden="true" />}
            placeholder="+1 555 000 0000"
            helperText="Required. At least 10 characters."
            value={form.phone}
            onChange={update('phone')}
          />
          <Input
            id="apply-address"
            label="Address *"
            icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
            placeholder="City, Country"
            value={form.address}
            onChange={update('address')}
          />
        </div>
        <div className="space-y-2">
          <FileFieldLabel>Profile Photo</FileFieldLabel>
          <FileUpload
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/avif"
            maxSize={5 * 1024 * 1024}
            label="Upload profile photo"
            value={form.photo}
            onChange={setFile('photo')}
          />
        </div>
      </FormSection>

      {/* Section 2 - Professional Background */}
      <FormSection
        icon={GraduationCap}
        title="Professional Background"
        description="Your credentials, experience, and expertise."
        required={hasRequiredField(SECTIONS[1].fields)}
        done={isSectionDone(SECTIONS[1].fields)}
      >
        <Textarea
          id="apply-qualification"
          label="Qualifications *"
          rows={3}
          placeholder="Degrees, certifications, or training you've completed"
          helperText="List your academic and professional credentials."
          value={form.qualification}
          onChange={update('qualification')}
        />
        <Textarea
          id="apply-experience"
          label="Teaching Experience *"
          rows={3}
          placeholder="Years of experience, subjects taught, or industry background"
          helperText="Share your teaching or industry experience."
          value={form.experience}
          onChange={update('experience')}
        />
        <Input
          id="apply-expertise"
          label="Expertise (comma-separated)"
          icon={<Wrench className="h-5 w-5" aria-hidden="true" />}
          placeholder="e.g. React, Machine Learning, Cloud"
          helperText="Add your key skills separated by commas."
          value={form.expertise}
          onChange={update('expertise')}
        />
        <Textarea
          id="apply-bio"
          label="Bio"
          rows={3}
          placeholder="A short introduction students will see on your profile"
          helperText="Optional. Introduce yourself to learners."
          value={form.bio}
          onChange={update('bio')}
        />
      </FormSection>

      {/* Section 3 - Teaching Motivation */}
      <FormSection
        icon={MessageSquareQuote}
        title="Teaching Motivation"
        description="Why do you want to teach on NextEra?"
        required={hasRequiredField(SECTIONS[2].fields)}
        done={isSectionDone(SECTIONS[2].fields)}
      >
        <Input
          id="apply-categories"
          label="Categories (comma-separated IDs) *"
          icon={<Tag className="h-5 w-5" aria-hidden="true" />}
          placeholder="e.g. 60b9c1f2a1b2c3d4e5f60708"
          helperText="Add at least one category ID separated by commas."
          value={form.categories}
          onChange={update('categories')}
        />
        <Textarea
          id="apply-reason"
          label="Why do you want to teach? *"
          rows={4}
          placeholder="Tell us what motivates you to share your knowledge"
          helperText="A genuine, specific answer strengthens your application."
          value={form.reason}
          onChange={update('reason')}
        />
      </FormSection>

      {/* Section 4 - Portfolio */}
      <FormSection
        icon={Briefcase}
        title="Portfolio"
        description="Showcase your work, profiles, and demo video."
        required={hasRequiredField(SECTIONS[3].fields)}
        done={isSectionDone(SECTIONS[3].fields)}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="apply-linkedin"
            label="LinkedIn"
            icon={<Linkedin className="h-5 w-5" aria-hidden="true" />}
            placeholder="https://linkedin.com/in/you"
            helperText="Profile URL"
            value={form.linkedin}
            onChange={update('linkedin')}
          />
          <Input
            id="apply-github"
            label="GitHub"
            icon={<Github className="h-5 w-5" aria-hidden="true" />}
            placeholder="https://github.com/you"
            helperText="Profile URL"
            value={form.github}
            onChange={update('github')}
          />
          <Input
            id="apply-portfolio"
            label="Portfolio"
            icon={<Link2 className="h-5 w-5" aria-hidden="true" />}
            placeholder="https://your-portfolio.com"
            value={form.portfolio}
            onChange={update('portfolio')}
          />
          <Input
            id="apply-website"
            label="Website"
            icon={<Globe className="h-5 w-5" aria-hidden="true" />}
            placeholder="https://your-website.com"
            value={form.website}
            onChange={update('website')}
          />
        </div>
        <div className="space-y-2">
          <FileFieldLabel>Demo Video</FileFieldLabel>
          <FileUpload
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
            maxSize={200 * 1024 * 1024}
            label="Upload demo video"
            value={form.demoVideo}
            onChange={setFile('demoVideo')}
          />
        </div>
      </FormSection>

      {/* Section 5 - Verification & Payouts */}
      <FormSection
        icon={ShieldCheck}
        title="Verification & Payouts"
        description="Identity documents and payout details."
        required={hasRequiredField(SECTIONS[4].fields)}
        done={isSectionDone(SECTIONS[4].fields)}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <FileFieldLabel>Resume</FileFieldLabel>
            <FileUpload
              accept=".pdf,.doc,.docx,application/pdf,application/msword"
              maxSize={10 * 1024 * 1024}
              label="Upload resume"
              value={form.resume}
              onChange={setFile('resume')}
            />
          </div>
          <div className="space-y-2">
            <FileFieldLabel>Identity Proof</FileFieldLabel>
            <FileUpload
              accept="image/png,image/jpeg,image/heic,image/heif,image/avif,application/pdf"
              maxSize={10 * 1024 * 1024}
              label="Upload identity proof"
              value={form.identityProof}
              onChange={setFile('identityProof')}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
            Tax Details
          </h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Input
              id="apply-tax-pan"
              label="PAN"
              icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
              placeholder="PAN number"
              value={form.taxPan}
              onChange={update('taxPan')}
            />
            <Input
              id="apply-tax-gst"
              label="GST"
              icon={<Receipt className="h-5 w-5" aria-hidden="true" />}
              placeholder="GST number"
              value={form.taxGst}
              onChange={update('taxGst')}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Landmark className="h-4 w-4 text-primary" aria-hidden="true" />
            Bank Details
          </h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Input
              id="apply-bank-holder"
              label="Account Holder Name *"
              icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
              placeholder="Name on the account"
              value={form.bankHolder}
              onChange={update('bankHolder')}
            />
            <Input
              id="apply-bank-account"
              label="Account Number *"
              icon={<Hash className="h-5 w-5" aria-hidden="true" />}
              placeholder="Bank account number"
              value={form.bankAccount}
              onChange={update('bankAccount')}
            />
            <Input
              id="apply-bank-ifsc"
              label="IFSC Code *"
              icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
              placeholder="IFSC code"
              value={form.bankIfsc}
              onChange={update('bankIfsc')}
            />
            <Input
              id="apply-bank-name"
              label="Bank Name *"
              icon={<Landmark className="h-5 w-5" aria-hidden="true" />}
              placeholder="Bank name"
              value={form.bankName}
              onChange={update('bankName')}
            />
            <Input
              id="apply-bank-branch"
              label="Branch"
              icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
              placeholder="Branch"
              value={form.bankBranch}
              onChange={update('bankBranch')}
            />
            <Input
              id="apply-bank-upi"
              label="UPI ID"
              icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
              placeholder="yourname@bank"
              value={form.bankUpi}
              onChange={update('bankUpi')}
            />
          </div>
        </div>
      </FormSection>

      {/* Desktop submit panel */}
      <div className="hidden items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm lg:flex sm:p-6">
        <div>
          <p className="text-sm font-semibold text-foreground">Ready to apply?</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {canSubmit
              ? 'Complete the required fields to enable submission.'
              : 'Review your details before submitting your application.'}
          </p>
        </div>
        <Button
          size="lg"
          className="h-12 rounded-full px-8 font-semibold shadow-lg shadow-primary/25"
          onClick={submit}
          disabled={canSubmit}
        >
          {mutation.isPending ? 'Submitting...' : (
            <>
              Submit Application <Send className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>

      {/* Mobile sticky submit bar */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground">
              Required fields · {requiredDone}/{REQUIRED_FIELDS.length}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-aura-secondary transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <Button
            size="lg"
            className="h-12 shrink-0 rounded-full px-6 font-semibold"
            onClick={submit}
            disabled={canSubmit}
          >
            {mutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}
