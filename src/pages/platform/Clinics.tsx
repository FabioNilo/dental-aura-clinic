import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Edit, Loader2, LogOut, Plus, Search, ShieldCheck, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usePlatformAuth } from "@/features/auth/PlatformAuth";
import {
  platformApi,
  type PlatformClinic,
  type UpsertPlatformClinicPayload,
} from "@/features/integrations/dental-api";

type ClinicFormState = {
  active: boolean;
  city: string;
  document: string;
  email: string;
  name: string;
  phone: string;
  plan: PlatformClinic["plan"];
  slug: string;
};

type UserFormState = {
  clinic_id: string;
  email: string;
  name: string;
  password: string;
  role: "clinic_admin" | "clinic_staff" | "dentist";
};

const emptyClinicForm: ClinicFormState = {
  active: true,
  city: "",
  document: "",
  email: "",
  name: "",
  phone: "",
  plan: "starter",
  slug: "",
};

const emptyUserForm: UserFormState = {
  clinic_id: "",
  email: "",
  name: "",
  password: "",
  role: "clinic_admin",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formFromClinic(clinic: PlatformClinic): ClinicFormState {
  return {
    active: clinic.active,
    city: clinic.city ?? "",
    document: clinic.document ?? "",
    email: clinic.email ?? "",
    name: clinic.name,
    phone: clinic.phone ?? "",
    plan: clinic.plan,
    slug: clinic.slug,
  };
}

function toPayload(form: ClinicFormState): UpsertPlatformClinicPayload {
  return {
    active: form.active,
    city: form.city.trim() || null,
    document: form.document.trim() || null,
    email: form.email.trim().toLowerCase() || null,
    name: form.name.trim(),
    phone: form.phone.trim() || null,
    plan: form.plan,
    slug: form.slug.trim() || slugify(form.name),
  };
}

const PlatformClinics = () => {
  const { admin, signOut } = usePlatformAuth();
  const { toast } = useToast();
  const [clinics, setClinics] = useState<PlatformClinic[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clinicForm, setClinicForm] = useState<ClinicFormState>(emptyClinicForm);
  const [editingClinic, setEditingClinic] = useState<PlatformClinic | null>(null);
  const [editForm, setEditForm] = useState<ClinicFormState>(emptyClinicForm);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);

  const activeCount = useMemo(() => clinics.filter((clinic) => clinic.active).length, [clinics]);

  const loadClinics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await platformApi.listClinics(query.trim() || undefined);
      setClinics(result.items);
    } catch (error) {
      toast({
        title: "Erro ao carregar clinicas",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    void loadClinics();
  }, [loadClinics]);

  const handleCreateClinic = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await platformApi.createClinic(toPayload(clinicForm));
      setClinicForm(emptyClinicForm);
      await loadClinics();
      toast({ title: "Clinica criada" });
    } catch (error) {
      toast({
        title: "Erro ao criar clinica",
        description: error instanceof Error ? error.message : "Confira os dados.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateClinic = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingClinic) return;

    setSaving(true);
    try {
      await platformApi.updateClinic(editingClinic.id, toPayload(editForm));
      setEditingClinic(null);
      await loadClinics();
      toast({ title: "Clinica atualizada" });
    } catch (error) {
      toast({
        title: "Erro ao atualizar clinica",
        description: error instanceof Error ? error.message : "Confira os dados.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await platformApi.createUser({
        clinic_id: userForm.clinic_id,
        email: userForm.email.trim().toLowerCase(),
        name: userForm.name.trim() || null,
        password: userForm.password.trim() || undefined,
        role: userForm.role,
      });
      setUserForm(emptyUserForm);
      toast({ title: "Usuario vinculado" });
    } catch (error) {
      toast({
        title: "Erro ao criar usuario",
        description: error instanceof Error ? error.message : "Confira os dados.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.assign("/platform/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold font-headline">Dental Aura Platform</span>
              <p className="hidden text-xs text-muted-foreground sm:block">{admin?.email}</p>
            </div>
          </div>
          <Button onClick={handleLogout} size="sm" variant="outline">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5" />
                Nova clinica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateClinic}>
                <ClinicForm form={clinicForm} setForm={setClinicForm} />
                <Button className="w-full" disabled={saving} type="submit">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Criar clinica
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5" />
                Usuario da clinica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateUser}>
                <div className="space-y-2">
                  <Label htmlFor="clinic-user-clinic">Clinica</Label>
                  <Select
                    onValueChange={(clinicId) => setUserForm((form) => ({ ...form, clinic_id: clinicId }))}
                    value={userForm.clinic_id}
                  >
                    <SelectTrigger id="clinic-user-clinic">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinics.map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-user-name">Nome</Label>
                  <Input
                    id="clinic-user-name"
                    value={userForm.name}
                    onChange={(event) => setUserForm((form) => ({ ...form, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-user-email">Email</Label>
                  <Input
                    id="clinic-user-email"
                    type="email"
                    value={userForm.email}
                    onChange={(event) => setUserForm((form) => ({ ...form, email: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-user-password">Senha inicial</Label>
                  <Input
                    id="clinic-user-password"
                    type="password"
                    value={userForm.password}
                    onChange={(event) => setUserForm((form) => ({ ...form, password: event.target.value }))}
                  />
                </div>
                <Button className="w-full" disabled={saving || !userForm.clinic_id} type="submit">
                  <UserPlus className="h-4 w-4" />
                  Vincular usuario
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Clinicas
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{clinics.length} total</Badge>
                <Badge>{activeCount} ativas</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nome, slug ou cidade"
                  value={query}
                />
              </div>
              <Button disabled={loading} onClick={loadClinics} variant="outline">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinica</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Cidade</TableHead>
                  <TableHead className="w-24 text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-24 text-center text-muted-foreground" colSpan={5}>
                      Nenhuma clinica encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  clinics.map((clinic) => (
                    <TableRow key={clinic.id}>
                      <TableCell>
                        <div className="font-medium">{clinic.name}</div>
                        <div className="text-xs text-muted-foreground">{clinic.slug}</div>
                      </TableCell>
                      <TableCell className="capitalize">{clinic.plan}</TableCell>
                      <TableCell>
                        <Badge variant={clinic.active ? "default" : "secondary"}>
                          {clinic.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{clinic.city || "-"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            onClick={() => {
                              setEditingClinic(clinic);
                              setEditForm(formFromClinic(clinic));
                            }}
                            size="icon"
                            variant="outline"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={Boolean(editingClinic)} onOpenChange={(open) => !open && setEditingClinic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar clinica</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdateClinic}>
            <ClinicForm form={editForm} setForm={setEditForm} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingClinic(null)}>
                Cancelar
              </Button>
              <Button disabled={saving} type="submit">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ClinicForm({
  form,
  setForm,
}: {
  form: ClinicFormState;
  setForm: React.Dispatch<React.SetStateAction<ClinicFormState>>;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="clinic-name">Nome</Label>
        <Input
          id="clinic-name"
          required
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              name: event.target.value,
              slug: current.slug || slugify(event.target.value),
            }))
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="clinic-slug">Slug</Label>
          <Input
            id="clinic-slug"
            required
            value={form.slug}
            onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clinic-plan">Plano</Label>
          <Select
            onValueChange={(plan: PlatformClinic["plan"]) => setForm((current) => ({ ...current, plan }))}
            value={form.plan}
          >
            <SelectTrigger id="clinic-plan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="growth">Growth</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="clinic-email">Email</Label>
          <Input
            id="clinic-email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clinic-phone">Telefone</Label>
          <Input
            id="clinic-phone"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="clinic-document">Documento</Label>
          <Input
            id="clinic-document"
            value={form.document}
            onChange={(event) => setForm((current) => ({ ...current, document: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clinic-city">Cidade</Label>
          <Input
            id="clinic-city"
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
          />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <Label htmlFor="clinic-active">Clinica ativa</Label>
        <Switch
          checked={form.active}
          id="clinic-active"
          onCheckedChange={(active) => setForm((current) => ({ ...current, active }))}
        />
      </div>
    </>
  );
}

export default PlatformClinics;
