import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { useAddresses, useCreateAddress, useDeleteAddress, useUpdateAddress, type AddressInput } from '@/features/checkout/hooks/useAddresses';
import type { Address } from '@/features/checkout/types';
import { useChangePassword, useDeleteAccount, useUpdateProfile } from '../hooks/useProfile';

const profileSchema = z.object({ name: z.string().min(2, 'Informe seu nome'), email: z.string().email('Email inválido') });
const passwordSchema = z.object({ current_password: z.string().min(1, 'Informe a senha atual'), password: z.string().min(8, 'Mínimo de 8 caracteres') });
const addressSchema = z.object({
  label: z.string().optional(), zip_code: z.string().regex(/^\d{8}$/, 'Use 8 números'), street: z.string().min(1, 'Obrigatório'),
  number: z.string().min(1, 'Obrigatório'), complement: z.string().optional(), neighborhood: z.string().min(1, 'Obrigatório'),
  city: z.string().min(1, 'Obrigatório'), state: z.string().length(2, 'Use a sigla do estado'), is_default: z.boolean(),
});
type ProfileForm = z.infer<typeof profileSchema>; type PasswordForm = z.infer<typeof passwordSchema>; type AddressForm = z.infer<typeof addressSchema>;
const input = 'w-full rounded-2xl border border-roseartisan-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-roseartisan-100';

export function AccountPage() {
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState<Address | null>(null);
  const { data: addresses = [] } = useAddresses(true);
  const updateProfile = useUpdateProfile(); const changePassword = useChangePassword(); const deleteAccount = useDeleteAccount();
  const createAddress = useCreateAddress(); const updateAddress = useUpdateAddress(); const deleteAddress = useDeleteAddress();
  const profile = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name ?? '', email: user?.email ?? '' } });
  const password = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const address = useForm<AddressForm>({ resolver: zodResolver(addressSchema), defaultValues: { label: '', zip_code: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', is_default: false } });
  const errorText = (message?: string) => message ? <p className="mt-1 text-xs text-rose-600">{message}</p> : null;

  const edit = (item: Address) => { setEditing(item); address.reset({ ...item, label: item.label ?? '', complement: item.complement ?? '' }); };
  const resetAddress = () => { setEditing(null); address.reset({ label: '', zip_code: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', is_default: false }); };
  const saveAddress = async (values: AddressForm) => {
    try { editing ? await updateAddress.mutateAsync({ id: editing.id, input: values as AddressInput }) : await createAddress.mutateAsync(values as AddressInput); resetAddress(); toast.success('Endereço salvo'); }
    catch { toast.error('Não foi possível salvar o endereço'); }
  };

  return <div className="mx-auto max-w-4xl space-y-8">
    <div><p className="text-sm uppercase tracking-[0.2em] text-roseartisan-700">Perfil</p><h1 className="text-4xl">Minha conta</h1></div>
    <section className="card-surface p-6"><h2 className="mb-4 text-2xl">Dados pessoais</h2>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={profile.handleSubmit(async v => { try { const updated = await updateProfile.mutateAsync(v); updateUser(updated); toast.success('Dados atualizados'); } catch { toast.error('Não foi possível atualizar'); } })}>
        <label>Nome<input className={input} {...profile.register('name')} />{errorText(profile.formState.errors.name?.message)}</label>
        <label>Email<input className={input} type="email" {...profile.register('email')} />{errorText(profile.formState.errors.email?.message)}</label>
        <button className="rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white sm:col-span-2" disabled={updateProfile.isPending}>Salvar dados</button>
      </form>
    </section>
    <section className="card-surface p-6"><h2 className="mb-4 text-2xl">Alterar senha</h2>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={password.handleSubmit(async v => { try { await changePassword.mutateAsync(v); password.reset(); toast.success('Senha alterada. Entre novamente.'); await logout(); } catch { toast.error('Verifique sua senha atual'); } })}>
        <label>Senha atual<input className={input} type="password" {...password.register('current_password')} />{errorText(password.formState.errors.current_password?.message)}</label>
        <label>Nova senha<input className={input} type="password" {...password.register('password')} />{errorText(password.formState.errors.password?.message)}</label>
        <button className="rounded-full border border-roseartisan-300 px-5 py-3 text-sm font-semibold sm:col-span-2">Alterar senha</button>
      </form>
    </section>
    <section className="card-surface p-6"><h2 className="mb-4 text-2xl">Meus endereços</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">{addresses.map(a => <article key={a.id} className="rounded-2xl border border-roseartisan-200 p-4"><div className="flex justify-between"><strong>{a.label || 'Endereço'} {a.is_default && '• Principal'}</strong><div className="space-x-2"><button className="text-roseartisan-700" onClick={() => edit(a)}>Editar</button><button className="text-rose-700" onClick={async () => { if (confirm('Excluir este endereço?')) await deleteAddress.mutateAsync(a.id); }}>Excluir</button></div></div><p className="mt-2 text-sm text-stone-600">{a.street}, {a.number} — {a.city}/{a.state}</p></article>)}</div>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={address.handleSubmit(saveAddress)}>
        {(['label','zip_code','street','number','complement','neighborhood','city','state'] as const).map(field => <label key={field} className={field === 'street' ? 'sm:col-span-2' : ''}>{({label:'Apelido',zip_code:'CEP',street:'Rua',number:'Número',complement:'Complemento',neighborhood:'Bairro',city:'Cidade',state:'Estado'})[field]}<input className={input} maxLength={field === 'state' ? 2 : undefined} {...address.register(field)} />{errorText(address.formState.errors[field]?.message)}</label>)}
        <label className="flex items-center gap-2"><input type="checkbox" {...address.register('is_default')} /> Endereço principal</label>
        <div className="flex gap-2 sm:col-span-2"><button className="rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white">{editing ? 'Atualizar' : 'Adicionar'} endereço</button>{editing && <button type="button" className="px-4" onClick={resetAddress}>Cancelar</button>}</div>
      </form>
    </section>
    <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6"><h2 className="text-xl text-rose-800">Excluir conta</h2><p className="my-3 text-sm text-rose-700">Seus dados pessoais serão anonimizados. O histórico financeiro dos pedidos será preservado.</p><button className="rounded-full bg-rose-700 px-5 py-3 text-sm font-semibold text-white" onClick={async () => { if (confirm('Esta ação é permanente. Excluir sua conta?')) { await deleteAccount.mutateAsync(); await logout(); } }}>Excluir minha conta</button></section>
  </div>;
}
